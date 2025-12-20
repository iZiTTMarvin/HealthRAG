import random
import torch
from torch import nn
import os
import pickle

from sklearn.model_selection import train_test_split
from torch.utils.data import Dataset, DataLoader
from transformers import BertModel, BertTokenizer
from tqdm import tqdm
from seqeval.metrics import f1_score
import ahocorasick
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

"""
命名实体识别 (NER) 模型模块
包含基于 BERT+RNN 的深度学习模型实现、基于 AC 自动机的规则提取、以及数据增强策略。
"""

# 模型保存名称
cache_model = 'best_roberta_rnn_model_ent_aug'

def get_data(path, max_len=None):
    """
    从指定路径加载训练/验证数据。
    数据格式预期为每行一个字符和对应的标签，以空格分隔。
    """
    all_text, all_tag = [], []
    with open(path, 'r', encoding='utf8') as f:
        all_data = f.read().split('\n')

    sen, tag = [], []
    for data in all_data:
        data = data.split(' ')
        if(len(data) != 2):
            if len(sen) > 2:
                all_text.append(sen)
                all_tag.append(tag)
            sen, tag = [], []
            continue
        te, ta = data
        sen.append(te)
        tag.append(ta)
    if max_len is not None:
        return all_text[:max_len], all_tag[:max_len]
    return all_text, all_tag

class rule_find:
    """
    基于 AC 自动机 (Aho-Corasick) 的规则匹配类。
    用于在文本中快速搜索已知的医疗实体。
    """
    def __init__(self):
        # 定义支持的实体类型及其索引
        self.idx2type = idx2type = ["食物", "药品商", "治疗方法", "药品","检查项目","疾病","疾病症状","科目"]
        self.type2idx = type2idx = {"食物": 0, "药品商": 1, "治疗方法": 2, "药品": 3,"检查项目":4,"疾病":5,"疾病症状":6,"科目":7}
        # 为每种类型初始化一个 AC 自动机
        self.ahos = [ahocorasick.Automaton() for i in range(len(self.type2idx))]

        # 从本地文件中加载实体库并构建自动机
        for type in idx2type:
            with open(os.path.join('data','ent_aug',f'{type}.txt'), encoding='utf-8') as f:
                all_en = f.read().split('\n')
            for en in all_en:
                en = en.split(' ')[0]
                if len(en) >= 2:
                    self.ahos[type2idx[type]].add_word(en, en)
        for i in range(len(self.ahos)):
            self.ahos[i].make_automaton()

    def find(self, sen):
        """
        在句子中搜索匹配的实体。
        
        Returns:
            list: 包含匹配结果的列表 [(起始位置, 结束位置, 实体类型, 实体文本), ...]
        """
        rule_result = []
        mp = {}
        all_res = []
        all_ty = []
        for i in range(len(self.ahos)):
            now = list(self.ahos[i].iter(sen))
            all_res.extend(now)
            for j in range(len(now)):
                all_ty.append(self.idx2type[i])
        
        if len(all_res) != 0:
            # 按匹配长度从长到短排序，处理包含关系
            all_res = sorted(all_res, key=lambda x: len(x[1]), reverse=True)
            for i, res in enumerate(all_res):
                be = res[0] - len(res[1]) + 1
                ed = res[0]
                if be in mp or ed in mp:
                    continue
                rule_result.append((be, ed, all_ty[i], res[1]))
                for t in range(be, ed + 1):
                    mp[t] = 1
        return rule_result


def find_entities(tag):
    """
    从 BIO 格式的标签序列中解析出实体及其范围。
    
    Args:
        tag: 标签列表，例如 ['B-药品', 'I-药品', 'O', 'B-疾病']
    Returns:
        list: 实体元组列表 [(起始索引, 结束索引, 实体类型), ...]
    """
    result = []
    label_len = len(tag)
    i = 0
    while(i < label_len):
        if(tag[i][0] == 'B'):
            type = tag[i].strip('B-')
            j = i + 1
            while(j < label_len and tag[j][0] == 'I'):
                j += 1
            result.append((i, j - 1, type))
            i = j
        else:
            i = i + 1
    return result


class tfidf_alignment():
    """
    基于 TF-IDF 和余弦相似度的实体对齐类。
    用于将模型识别出的实体归一化到标准库中的已知实体。
    """
    def __init__(self):
        eneities_path = os.path.join('data/ent_aug')
        files = os.listdir(eneities_path)
        files = [docu for docu in files if '.py' not in docu]

        self.tag_2_embs = {}
        self.tag_2_tfidf_model = {}
        self.tag_2_entity = {}
        # 为每种实体类型预先计算 TF-IDF 向量
        for ty in files:
            with open(os.path.join(eneities_path, ty), 'r', encoding='utf-8') as f:
                entities = f.read().split('\n')
                entities = [ent for ent in entities if len(ent.split(' ')[0]) <= 15 and len(ent.split(' ')[0]) >= 1]
                en_name = [ent.split(' ')[0] for ent in entities]
                ty = ty.strip('.txt')
                self.tag_2_entity[ty] = en_name
                tfidf_model = TfidfVectorizer(analyzer="char")
                embs = tfidf_model.fit_transform(en_name).toarray()
                self.tag_2_embs[ty] = embs
                self.tag_2_tfidf_model[ty] = tfidf_model

    def align(self, ent_list):
        """
        对实体列表进行模糊匹配对齐。
        """
        new_result = {}
        for s, e, cls, ent in ent_list:
            if cls not in self.tag_2_tfidf_model:
                continue
            ent_emb = self.tag_2_tfidf_model[cls].transform([ent])
            sim_score = cosine_similarity(ent_emb, self.tag_2_embs[cls])
            max_idx = sim_score[0].argmax()
            max_score = sim_score[0][max_idx]

            # 只有相似度超过阈值才认为对齐成功
            if max_score >= 0.5:
                new_result[cls] = self.tag_2_entity[cls][max_idx]
        return new_result


class Entity_Extend:
    """
    数据增强类，包含实体替换、掩盖、拼接等策略。
    用于提高模型在少样本或长尾实体上的泛化能力。
    """
    def __init__(self):
        eneities_path = os.path.join('data','ent')
        if not os.path.exists(eneities_path):
             eneities_path = os.path.join('data','ent_aug')
        files = os.listdir(eneities_path)
        files = [docu for docu in files if '.py' not in docu]

        self.type2entity = {}
        self.type2weight = {}
        for type in files:
            with open(os.path.join(eneities_path, type), 'r', encoding='utf-8') as f:
                entities = f.read().split('\n')
                en_name = [ent for ent in entities if len(ent.split(' ')[0]) <= 15 and len(ent.split(' ')[0]) >= 1]
                en_weight = [1] * len(en_name)
                type = type.strip('.txt')
                self.type2entity[type] = en_name
                self.type2weight[type] = en_weight

    def no_work(self, te, tag, type):
        return te, tag

    # 策略 1: 实体替换（用库中同类型的其他实体替换）
    def entity_replace(self, te, ta, type):
        choice_ent = random.choices(self.type2entity[type], weights=self.type2weight[type], k=1)[0]
        ta = ["B-"+type] + ["I-"+type] * (len(choice_ent)-1)
        return list(choice_ent), ta

    # 策略 2: 实体部分掩盖
    def entity_mask(self, te, ta, type):
        if(len(te) <= 3):
            return te, ta
        elif(len(te) <= 5):
            te.pop(random.randint(0, len(te)-1))
        else:
            te.pop(random.randint(0, len(te)-1))
            te.pop(random.randint(0, len(te)-1))
        ta = ["B-" + type] + ["I-" + type] * (len(te)-1)
        return te, ta

    # 策略 3: 实体拼接（增加同类实体的并列出现频率）
    def entity_union(self, te, ta, type):
        words = ['和', '与', '以及']
        wor = random.choice(words)
        choice_ent = random.choices(self.type2entity[type], weights=self.type2weight[type], k=1)[0]
        te = te + list(wor) + list(choice_ent)
        ta = ta + ['O'] * len(wor) + ["B-" + type] + ["I-" + type] * (len(choice_ent)-1)
        return te, ta

    def entities_extend(self, text, tag, ents):
        cho = [self.no_work, self.entity_union, self.entity_mask, self.entity_replace, self.no_work]
        new_text = text.copy()
        new_tag = tag.copy()
        sign = 0
        for ent in ents:
            p = random.choice(cho)
            te, ta = p(text[ent[0]:ent[1]+1], tag[ent[0]:ent[1]+1], ent[2])
            new_text[ent[0] + sign:ent[1] + 1 + sign], new_tag[ent[0] + sign:ent[1] + 1 + sign] = te, ta
            sign += len(te) - (ent[1] - ent[0] + 1)

        return new_text, new_tag


class Nerdataset(Dataset):
    """
    NER 任务的 PyTorch Dataset 类。
    """
    def __init__(self, all_text, all_label, tokenizer, max_len, tag2idx, is_dev=False, enhance_data=False):
        self.all_text = all_text
        self.all_label = all_label
        self.tokenizer = tokenizer
        self.max_len = max_len
        self.tag2idx = tag2idx
        self.is_dev = is_dev
        self.entity_extend = Entity_Extend()
        self.enhance_data = enhance_data

    def __getitem__(self, x):
        text, label = self.all_text[x], self.all_label[x]
        if self.is_dev:
            # 验证集不进行数据增强
            max_len = min(len(self.all_text[x]) + 2, 500)
        else:
            # 训练集按概率进行增强
            if self.enhance_data and random.random() > 0.5:
                ents = find_entities(label)
                text, label = self.entity_extend.entities_extend(text, label, ents)
            max_len = self.max_len
        
        text, label = text[:max_len - 2], label[:max_len - 2]
        x_len = len(text)
        
        # 将文本和标签转换为索引
        text_idx = self.tokenizer.encode(text, add_special_tokens=True)
        label_idx = [self.tag2idx['<PAD>']] + [self.tag2idx[i] for i in label] + [self.tag2idx['<PAD>']]

        # 填充到固定长度
        text_idx += [0] * (max_len - len(text_idx))
        label_idx += [self.tag2idx['<PAD>']] * (max_len - len(label_idx))
        return torch.tensor(text_idx), torch.tensor(label_idx), x_len

    def __len__(self):
        return len(self.all_text)


def build_tag2idx(all_tag):
    """构建标签到索引的映射表"""
    tag2idx = {'<PAD>': 0}
    for sen in all_tag:
        for tag in sen:
            tag2idx[tag] = tag2idx.get(tag, len(tag2idx))
    return tag2idx


class Bert_Model(nn.Module):
    """
    基于 BERT + RNN 的 NER 模型实现。
    """
    def __init__(self, model_name, hidden_size, tag_num, bi):
        super().__init__()
        self.bert = BertModel.from_pretrained(model_name)
        # 使用 RNN 提取序列特征
        self.gru = nn.RNN(input_size=768, hidden_size=hidden_size, num_layers=2, batch_first=True, bidirectional=bi)
        if bi:
            self.classifier = nn.Linear(hidden_size * 2, tag_num)
        else:
            self.classifier = nn.Linear(hidden_size, tag_num)
        # 忽略 <PAD> 标签的交叉熵损失
        self.loss_fn = nn.CrossEntropyLoss(ignore_index=0)

    def forward(self, x, label=None):
        bert_0, _ = self.bert(x, attention_mask=(x > 0), return_dict=False)
        gru_0, _ = self.gru(bert_0)
        pre = self.classifier(gru_0)
        if label is not None:
            # 训练模式，返回损失
            loss = self.loss_fn(pre.reshape(-1, pre.shape[-1]), label.reshape(-1))
            return loss
        else:
            # 预测模式，返回预测标签索引
            return torch.argmax(pre, dim=-1).squeeze(0)

def merge(model_result_word, rule_result):
    """
    合并模型预测结果和规则匹配结果。
    采用“冲突时取长文本”和“规则优先”的策略。
    """
    result = model_result_word + rule_result
    result = sorted(result, key=lambda x: len(x[-1]), reverse=True)
    check_result = []
    mp = {}
    for res in result:
        if res[0] in mp or res[1] in mp:
            continue
        check_result.append(res)
        for i in range(res[0], res[1] + 1):
            mp[i] = 1
    return check_result

def get_ner_result(model, tokenizer, sen, rule, tfidf_r, device, idx2tag):
    """
    NER 任务的完整推理流程：模型预测 -> 规则匹配 -> 合并 -> TF-IDF 对齐。
    """
    sen_to = tokenizer.encode(sen, add_special_tokens=True, return_tensors='pt').to(device)
    pre = model(sen_to).tolist()

    pre_tag = [idx2tag[i] for i in pre[1:-1]]
    model_result = find_entities(pre_tag)
    model_result_word = []
    for res in model_result:
        word = sen[res[0]:res[1] + 1]
        model_result_word.append((res[0], res[1], res[2], word))
    
    # 规则匹配
    rule_result = rule.find(sen)

    # 结果合并
    merge_result = merge(model_result_word, rule_result)
    
    # 标准化对齐
    tfidf_result = tfidf_r.align(merge_result)
    return tfidf_result

if __name__ == "__main__":
    # 示例训练/推理逻辑
    pass

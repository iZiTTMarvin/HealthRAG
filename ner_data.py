import os
import random
import ahocorasick
import re
from tqdm import tqdm
import sys

"""
NER 数据构造模块
该模块负责从原始的 medical.json 数据中提取文本，并利用 AC 自动机进行实体匹配，
自动生成用于 NER 模型训练的标注数据（采用 BIO 格式）。
"""

class Build_Ner_data():
    """
    NER 数据生成类。
    主要作用是将 data 文件夹下的 medical.json 文件中的文本打上标签。
    支持的标签包括：["疾病", "疾病症状", "检查项目", "科目", "食物", "药品商", "治疗方法", "药品"]。
    """
    def __init__(self):
        # 初始化实体类型及其映射
        self.idx2type = idx2type = ["疾病","疾病症状","检查项目","科目","食物","药品商","治疗方法","药品"]
        self.type2idx = type2idx = {"疾病":0,"疾病症状":1,"检查项目":2,"科目":3,"食物":4,"药品商":5,"治疗方法":6,"药品":7}
        # 设置文本切割的最大长度
        self.max_len = 30
        # 定义常见的标点符号，用于文本分割
        self.p = ['，', '。' , '！' , '；' , '：' , ',' ,'.','?','!',';']
        # 为每种实体类型初始化 AC 自动机
        self.ahos = [ahocorasick.Automaton() for i in range(len(idx2type))]

        # 从本地实体库加载词条到自动机
        for type in idx2type:
            file_path = os.path.join('data','ent_aug',f'{type}.txt')
            if os.path.exists(file_path):
                with open(file_path, encoding='utf-8') as f:
                    all_en = f.read().split('\n')
                for en in all_en:
                    if len(en) >= 2:
                        self.ahos[type2idx[type]].add_word(en, en)
        
        # 构建自动机
        for i in range(len(self.ahos)):
            self.ahos[i].make_automaton()

    def split_text(self, text):
        """
        将长文本按照标点符号随机分割为短文本，以适应模型输入长度并增加数据多样性。

        Args:
            text (str): 待分割的长文本。
        Returns:
            list: 分割后的短文本列表。
        """
        text = text.replace('\n', ',')
        # 使用正则表达式匹配标点符号进行分割
        pattern = r'([，。！；：,.?!;])(?=.)|[？,]'

        sentences = []
        for s in re.split(pattern, text):
            if s and len(s) > 0:
                sentences.append(s)

        sentences_text = [x for x in sentences if x not in self.p]
        sentences_Punctuation = [x for x in sentences[1::2] if x in self.p]
        split_text = []
        now_text = ''

        # 随机长度生成逻辑：
        # 有 15% 的概率生成极短文本，90% 的概率在超过 max_len 时进行切割。
        for i in range(len(sentences_text)):
            if (len(now_text) > self.max_len and random.random() < 0.9 or random.random() < 0.15) and len(now_text) > 0:
                split_text.append(now_text)
                now_text = sentences_text[i]
                if i < len(sentences_Punctuation):
                    now_text += sentences_Punctuation[i]
            else:
                now_text += sentences_text[i]
                if i < len(sentences_Punctuation):
                    now_text += sentences_Punctuation[i]
        
        if len(now_text) > 0:
            split_text.append(now_text)

        # 随机选取约 30% 的句子，强制以句号结尾
        for i in range(len(split_text)):
            if random.random() < 0.3:
                if(split_text[i][-1] in self.p):
                    split_text[i] = split_text[i][:-1] + '。'
                else:
                    split_text[i] = split_text[i] + '。'
        return split_text

    def make_text_label(self, text):
        """
        利用 AC 自动机对给定文本进行实体识别，并生成对应的 BIO 标签序列。

        Args:
            text (str): 待标注的文本。
        Returns:
            tuple: (label_list, match_count)
                   label_list: 标签序列 ['O', 'B-疾病', 'I-疾病', ...]
                   match_count: 匹配到的实体总数
        """
        label = ['O'] * len(text)
        flag = 0
        mp = {}
        # 遍历所有类型的自动机进行匹配
        for type in self.idx2type:
            li = list(self.ahos[self.type2idx[type]].iter(text))
            if len(li) == 0:
                continue
            # 按匹配文本长度降序排列，优先保留长实体
            li = sorted(li, key=lambda x: len(x[1]), reverse=True)
            for en in li:
                ed, name = en
                st = ed - len(name) + 1
                # 检查该范围是否已被占用
                if st in mp or ed in mp:
                    continue
                # 打上 BIO 标签
                label[st:ed+1] = ['B-' + type] + ['I-' + type] * (ed - st)
                flag = flag + 1
                # 记录已占用的索引
                for i in range(st, ed + 1):
                    mp[i] = 1
        return label, flag

def build_file(all_text, all_label):
    """
    将生成的文本和标签写入到本地文件，每行一个字符和标签，句子间用空行分隔。
    """
    save_path = os.path.join('data', 'ner_data_aug.txt')
    with open(save_path, "w", encoding="utf-8") as f:
        for text, label in zip(all_text, all_label):
            for t, l in zip(text, label):
                f.write(f'{t} {l}\n')
            f.write('\n')

if __name__ == "__main__":
    # 主程序入口：读取原始 JSON 并执行数据构造
    json_path = os.path.join('data', 'medical.json')
    if not os.path.exists(json_path):
        print(f"找不到数据文件: {json_path}")
        sys.exit(1)
        
    with open(json_path, 'r', encoding='utf-8') as f:
        all_data = f.read().split('\n')
    
    build_ner_data = Build_Ner_data()
    all_text, all_label = [], []

    print("开始构造 NER 标注数据...")
    for data in tqdm(all_data):
        if len(data) < 2:
            continue
        try:
            data = eval(data)
        except:
            continue
            
        # 提取描述、预防和病因字段进行文本增强和标注
        data_text = [data.get("desc", ""), data.get("prevent", ""), data.get("cause", "")]

        data_text_split = []
        for text in data_text:
            if len(text) == 0:
                continue
            text_split = build_ner_data.split_text(text)
            for tmp in text_split:
                if len(tmp) > 0:
                    data_text_split.append(tmp)
        
        for text in data_text_split:
            if len(text) == 0:
                continue
            label, flag = build_ner_data.make_text_label(text)
            # 只有包含至少一个实体的句子才会被存入数据集
            if flag >= 1:
                assert (len(text) == len(label))
                all_text.append(text)
                all_label.append(label)

    # 写入文件
    build_file(all_text, all_label)
    print(f"数据构造完成，共生成 {len(all_text)} 条标注数据。")


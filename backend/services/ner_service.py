import os
import pickle
import sys
from functools import lru_cache
from typing import Dict, Tuple

"""
NER 服务封装类
负责加载预训练的命名实体识别模型，并提供查询接口。
为了提高性能，模型实例被缓存（LRU Cache）。
"""

# 动态添加项目根目录到 Python 路径，确保可以导入根目录下的 ner_model 模块
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

import torch
from transformers import BertTokenizer

# 导入根目录下的 ner_model 模块（定义了模型架构和推理逻辑）
import ner_model as zwk

class NerService:
    def __init__(self, cache_model: str = "best_roberta_rnn_model_ent_aug"):
        # 指定要加载的模型权重文件名（不含扩展名）
        self._cache_model = cache_model

    @lru_cache(maxsize=1)
    def _load_model(
        self,
    ) -> Tuple[BertTokenizer, torch.nn.Module, list, Dict, Dict, torch.device]:
        """
        内部方法：从磁盘加载分词器、模型权重及相关配置。
        使用 lru_cache 确保模型只被加载一次。
        """
        # 检测可用计算设备 (GPU 或 CPU)
        device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")
        
        # 加载标签映射表
        with open("tmp_data/tag2idx.npy", "rb") as f:
            tag2idx = pickle.load(f)
        idx2tag = list(tag2idx)
        
        # 初始化辅助匹配工具（AC 自动机和 TF-IDF 对齐）
        rule = zwk.rule_find()
        tfidf_r = zwk.tfidf_alignment()
        
        # 加载预训练 BERT 分词器
        model_name = "model/chinese-roberta-wwm-ext"
        bert_tokenizer = BertTokenizer.from_pretrained(model_name)
        
        # 实例化模型架构
        bert_model = zwk.Bert_Model(model_name, hidden_size=128, tag_num=len(tag2idx), bi=True)
        # 加载保存的权重
        bert_model.load_state_dict(torch.load(f"model/{self._cache_model}.pt", map_location=device))
        bert_model = bert_model.to(device)
        # 设置为评估模式
        bert_model.eval()
        
        return bert_tokenizer, bert_model, idx2tag, rule, tfidf_r, device

    def get_entities(self, query: str) -> Dict[str, str]:
        """
        对外公开接口：对输入的查询文本进行 NER 识别，返回识别出的实体字典。
        """
        # 获取缓存的模型组件
        bert_tokenizer, bert_model, idx2tag, rule, tfidf_r, device = self._load_model()
        # 调用底层推理函数
        return zwk.get_ner_result(bert_model, bert_tokenizer, query, rule, tfidf_r, device, idx2tag)

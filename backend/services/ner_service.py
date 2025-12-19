import os
import pickle
import sys
from functools import lru_cache
from typing import Dict, Tuple

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

import torch
from transformers import BertTokenizer

import ner_model as zwk


class NerService:
    def __init__(self, cache_model: str = "best_roberta_rnn_model_ent_aug"):
        self._cache_model = cache_model

    @lru_cache(maxsize=1)
    def _load_model(
        self,
    ) -> Tuple[BertTokenizer, torch.nn.Module, list, Dict, Dict, torch.device]:
        device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")
        with open("tmp_data/tag2idx.npy", "rb") as f:
            tag2idx = pickle.load(f)
        idx2tag = list(tag2idx)
        rule = zwk.rule_find()
        tfidf_r = zwk.tfidf_alignment()
        model_name = "model/chinese-roberta-wwm-ext"
        bert_tokenizer = BertTokenizer.from_pretrained(model_name)
        bert_model = zwk.Bert_Model(model_name, hidden_size=128, tag_num=len(tag2idx), bi=True)
        bert_model.load_state_dict(torch.load(f"model/{self._cache_model}.pt", map_location=device))
        bert_model = bert_model.to(device)
        bert_model.eval()
        return bert_tokenizer, bert_model, idx2tag, rule, tfidf_r, device

    def get_entities(self, query: str) -> Dict[str, str]:
        bert_tokenizer, bert_model, idx2tag, rule, tfidf_r, device = self._load_model()
        return zwk.get_ner_result(bert_model, bert_tokenizer, query, rule, tfidf_r, device, idx2tag)

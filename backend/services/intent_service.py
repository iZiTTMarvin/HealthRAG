from typing import Optional

import model_config


class IntentService:
    def __init__(self):
        self._simple_intents = {
            "怎么办": ["简介", "治疗", "药品", "检查"],
            "吃什么": ["药品", "宜吃"],
            "不能吃": ["忌吃"],
            "症状": ["简介", "症状"],
            "原因": ["简介", "病因"],
            "预防": ["简介", "预防"],
            "检查": ["简介", "检查"],
            "治疗": ["简介", "治疗", "药品"],
            "并发": ["简介", "并发"],
            "生产": ["生产商"],
            "多久": ["简介", "治疗周期", "治愈概率"],
            "几天": ["简介", "治疗周期", "治愈概率"],
            "多长时间": ["简介", "治疗周期"],
            "能好": ["简介", "治疗周期", "治愈概率"],
            "能治好": ["简介", "治疗", "治愈概率"],
            "治愈": ["简介", "治愈概率", "治疗"],
            "痊愈": ["简介", "治愈概率", "治疗周期"],
            "恢复": ["简介", "治疗周期", "治愈概率"],
        }

    def recognize(self, query: str, model_name: str, model_type: str, api_key: Optional[str]) -> str:
        for keyword, intents in self._simple_intents.items():
            if keyword in query:
                intent_list = []
                for intent in intents:
                    if intent == "简介":
                        intent_list.append("查询疾病简介")
                    elif intent == "治疗":
                        intent_list.append("查询疾病的治疗方法")
                    elif intent == "药品":
                        intent_list.append("查询疾病所需药品")
                    elif intent == "宜吃":
                        intent_list.append("查询疾病宜吃食物")
                    elif intent == "忌吃":
                        intent_list.append("查询疾病忌吃食物")
                    elif intent == "检查":
                        intent_list.append("查询疾病所需检查项目")
                    elif intent == "症状":
                        intent_list.append("查询疾病的症状")
                    elif intent == "病因":
                        intent_list.append("查询疾病病因")
                    elif intent == "预防":
                        intent_list.append("查询疾病预防措施")
                    elif intent == "并发":
                        intent_list.append("查询疾病的并发疾病")
                    elif intent == "生产商":
                        intent_list.append("查询药品的生产商")
                    elif intent == "治疗周期":
                        intent_list.append("查询治疗周期")
                    elif intent == "治愈概率":
                        intent_list.append("查询治愈概率")
                return f"{intent_list} # 根据关键词'{keyword}'匹配"

        prompt = f"""
你是医疗意图识别专家。分析用户问题："{query}"

从以下类别选择最相关的（可多选，最多3个）：
- 查询疾病简介
- 查询疾病病因
- 查询疾病预防措施
- 查询疾病所需药品
- 查询疾病宜吃食物
- 查询疾病忌吃食物
- 查询疾病所需检查项目
- 查询疾病的症状
- 查询疾病的治疗方法
- 查询疾病的并发疾病
- 查询药品的生产商

直接输出：["类别1", "类别2"]
"""
        try:
            return model_config.call_model(model_name, prompt, model_type, api_key, stream=False)
        except Exception:
            return "[查询疾病简介] # 默认意图"

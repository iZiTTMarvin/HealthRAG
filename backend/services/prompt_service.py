import random
import re
from typing import Dict, Optional, Tuple


class PromptService:
    def add_shuxing_prompt(self, entity: str, shuxing: str, client) -> str:
        add_prompt = ""
        if client is None:
            add_prompt += "<提示>"
            add_prompt += f"用户对{entity}可能有查询{shuxing}需求，但Neo4j数据库未连接，无法查询知识图谱。"
            add_prompt += "</提示>"
            return add_prompt

        try:
            sql_q = "match (a:疾病{名称:'%s'}) return a.%s" % (entity, shuxing)
            res = client.run(sql_q).data()[0].values()
            add_prompt += "<提示>"
            add_prompt += f"用户对{entity}可能有查询{shuxing}需求，知识库内容如下："
            if len(res) > 0:
                join_res = "".join(res)
                add_prompt += join_res
            else:
                add_prompt += "图谱中无信息，查找失败。"
            add_prompt += "</提示>"
        except Exception as exc:
            add_prompt += "<提示>"
            add_prompt += f"用户对{entity}可能有查询{shuxing}需求，但查询知识图谱时发生错误：{str(exc)[:30]}。"
            add_prompt += "</提示>"
        return add_prompt

    def add_lianxi_prompt(self, entity: str, lianxi: str, target: str, client) -> str:
        add_prompt = ""
        if client is None:
            add_prompt += "<提示>"
            add_prompt += f"用户对{entity}可能有查询{lianxi}需求，但Neo4j数据库未连接，无法查询知识图谱。"
            add_prompt += "</提示>"
            return add_prompt

        try:
            sql_q = "match (a:疾病{名称:'%s'})-[r:%s]->(b:%s) return b.名称" % (entity, lianxi, target)
            res = client.run(sql_q).data()
            res = [list(data.values())[0] for data in res]
            add_prompt += "<提示>"
            add_prompt += f"用户对{entity}可能有查询{lianxi}需求，知识库内容如下："
            if len(res) > 0:
                join_res = "、".join(res)
                add_prompt += join_res
            else:
                add_prompt += "图谱中无信息，查找失败。"
            add_prompt += "</提示>"
        except Exception as exc:
            add_prompt += "<提示>"
            add_prompt += f"用户对{entity}可能有查询{lianxi}需求，但查询知识图谱时发生错误：{str(exc)[:30]}。"
            add_prompt += "</提示>"
        return add_prompt

    def generate_prompt(
        self,
        response: str,
        query: str,
        client,
        entities: Dict[str, str],
    ) -> Tuple[str, str, Dict[str, str]]:
        yitu = []
        prompt = "<指令>你是一个医疗问答机器人，你需要根据给定的提示回答用户的问题。请注意，你的全部回答必须完全基于给定的提示，不可自由发挥。如果根据提示无法给出答案，立刻回答“根据已知信息无法回答该问题”。</指令>"
        prompt += "<指令>请你仅针对医疗类问题提供简洁和专业的回答。如果问题不是医疗相关的，你一定要回答“我只能回答医疗相关的问题。”，以明确告知你的回答限制。</指令>"
        if "疾病症状" in entities and "疾病" not in entities:
            if client is not None:
                try:
                    sql_q = "match (a:疾病)-[r:疾病的症状]->(b:疾病症状 {名称:'%s'}) return a.名称" % (
                        entities["疾病症状"]
                    )
                    res = list(client.run(sql_q).data()[0].values())
                    if len(res) > 0:
                        entities["疾病"] = random.choice(res)
                        all_en = "、".join(res)
                        prompt += f"<提示>用户有{entities['疾病症状']}的情况，知识库推测其可能是得了{all_en}。请注意这只是一个推测，你需要明确告知用户这一点。</提示>"
                except Exception:
                    prompt += "<提示>用户有%s的情况，但查询知识图谱时发生错误，无法推测相关疾病。</提示>" % (
                        entities["疾病症状"]
                    )
            else:
                prompt += "<提示>用户有%s的情况，但Neo4j数据库未连接，无法查询相关疾病信息。</提示>" % (
                    entities["疾病症状"]
                )
        pre_len = len(prompt)
        if "简介" in response:
            if "疾病" in entities:
                prompt += self.add_shuxing_prompt(entities["疾病"], "疾病简介", client)
                yitu.append("查询疾病简介")
        if "病因" in response:
            if "疾病" in entities:
                prompt += self.add_shuxing_prompt(entities["疾病"], "疾病病因", client)
                yitu.append("查询疾病病因")
        if "预防" in response:
            if "疾病" in entities:
                prompt += self.add_shuxing_prompt(entities["疾病"], "预防措施", client)
                yitu.append("查询预防措施")
        if any(kw in response for kw in ["治疗周期", "多久", "几天", "多长时间", "能好", "痊愈", "恢复"]):
            if "疾病" in entities:
                prompt += self.add_shuxing_prompt(entities["疾病"], "治疗周期", client)
                yitu.append("查询治疗周期")
        if any(kw in response for kw in ["治愈概率", "能治好", "治愈", "治得好"]):
            if "疾病" in entities:
                prompt += self.add_shuxing_prompt(entities["疾病"], "治愈概率", client)
                yitu.append("查询治愈概率")
        if "易感人群" in response:
            if "疾病" in entities:
                prompt += self.add_shuxing_prompt(entities["疾病"], "疾病易感人群", client)
                yitu.append("查询疾病易感人群")
        if "药品" in response:
            if "疾病" in entities:
                prompt += self.add_lianxi_prompt(entities["疾病"], "疾病使用药品", "药品", client)
                yitu.append("查询疾病使用药品")
        if "宜吃食物" in response:
            if "疾病" in entities:
                prompt += self.add_lianxi_prompt(entities["疾病"], "疾病宜吃食物", "食物", client)
                yitu.append("查询疾病宜吃食物")
        if "忌吃食物" in response:
            if "疾病" in entities:
                prompt += self.add_lianxi_prompt(entities["疾病"], "疾病忌吃食物", "食物", client)
                yitu.append("查询疾病忌吃食物")
        if "检查项目" in response:
            if "疾病" in entities:
                prompt += self.add_lianxi_prompt(entities["疾病"], "疾病所需检查", "检查项目", client)
                yitu.append("查询疾病所需检查")
        if "查询疾病所属科目" in response:
            if "疾病" in entities:
                prompt += self.add_lianxi_prompt(entities["疾病"], "疾病所属科目", "科目", client)
                yitu.append("查询疾病所属科目")
        if "症状" in response:
            if "疾病" in entities:
                prompt += self.add_lianxi_prompt(entities["疾病"], "疾病的症状", "疾病症状", client)
                yitu.append("查询疾病的症状")
        if "治疗" in response:
            if "疾病" in entities:
                prompt += self.add_lianxi_prompt(entities["疾病"], "治疗的方法", "治疗方法", client)
                yitu.append("查询治疗的方法")
        if "并发" in response:
            if "疾病" in entities:
                prompt += self.add_lianxi_prompt(entities["疾病"], "疾病并发疾病", "疾病", client)
                yitu.append("查询疾病并发疾病")
        if "生产商" in response:
            if client is not None and "药品" in entities:
                try:
                    sql_q = "match (a:药品商)-[r:生产]->(b:药品{名称:'%s'}) return a.名称" % (entities["药品"])
                    res = client.run(sql_q).data()[0].values()
                    prompt += "<提示>"
                    prompt += f"用户对{entities['药品']}可能有查询药品生产商的需求，知识图谱内容如下："
                    if len(res) > 0:
                        prompt += "".join(res)
                    else:
                        prompt += "图谱中无信息，查找失败"
                    prompt += "</提示>"
                except Exception as exc:
                    prompt += f"<提示>查询药品生产商时发生错误：{str(exc)[:30]}</提示>"
            else:
                if "药品" in entities:
                    prompt += f"<提示>Neo4j数据库未连接，无法查询{entities['药品']}的生产商信息。</提示>"
                else:
                    prompt += "<提示>未识别到药品实体，无法查询生产商信息。</提示>"
            yitu.append("查询药物生产商")
        if pre_len == len(prompt):
            if any(word in query.lower() for word in ["你好", "hello", "hi", "介绍", "帮助", "什么"]):
                prompt += "<提示>用户可能是在问候或询问系统功能。请介绍你是一个专业的医疗RAG问答系统，可以回答医疗相关问题，包括疾病简介、症状、治疗方法、药物信息等。请鼓励用户提出具体的医疗问题。</提示>"
            else:
                prompt += "<提示>提示：知识库异常，没有相关信息！请你直接回答“根据已知信息无法回答该问题”！</提示>"
        prompt += f"<用户问题>{query}</用户问题>"
        prompt += "<注意>现在你已经知道给定的“<提示></提示>”和“<用户问题></用户问题>”了,你要极其认真的判断提示里是否有用户问题所需的信息，如果没有相关信息，你必须直接回答“根据已知信息无法回答该问题”。</注意>"
        prompt += "<注意>你一定要再次检查你的回答是否完全基于“<提示></提示>”的内容，不可产生提示之外的答案！换而言之，你的任务是根据用户的问题，将“<提示></提示>”整理成有条理、有逻辑的语句。你起到的作用仅仅是整合提示的功能，你一定不可以利用自身已经存在的知识进行回答，你必须从提示中找到问题的答案！</注意>"
        prompt += "<注意>你必须充分的利用提示中的知识，不可将提示中的任何信息遗漏，你必须做到对提示信息的充分整合。你回答的任何一句话必须在提示中有所体现！如果根据提示无法给出答案，你必须回答“根据已知信息无法回答该问题”。<注意>"
        return prompt, "、".join(yitu), entities

    def extract_knowledge(self, prompt: str) -> str:
        knowledge = re.findall(r"<提示>(.*?)</提示>", prompt)
        return "\n".join([f"提示{idx + 1}, {kn}" for idx, kn in enumerate(knowledge) if len(kn) >= 3])

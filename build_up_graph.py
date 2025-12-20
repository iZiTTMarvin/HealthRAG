import os
import re
from neo4j import GraphDatabase
from tqdm import tqdm
import argparse

"""
知识图谱构建模块
该脚本负责从 JSON 数据文件中读取医疗信息，并将其导入到 Neo4j 图数据库中。
包含实体的创建（疾病、药品、食物、检查项目等）以及它们之间关系的建立。
"""

# 导入普通实体（如药品、食物等，仅包含名称属性）
def import_entity(driver, type, entity):
    """
    通用实体导入函数
    
    Args:
        driver: Neo4j 驱动实例
        type: 节点标签类型 (例如 '药品', '食物')
        entity: 实体名称列表
    """
    def create_node(driver, type, name):
        # 使用 Cypher 语句创建节点
        order = """create (n:%s{名称:"%s"})""" % (type, name)
        with driver.session() as session:
            session.run(order)

    print(f'正在导入{type}类数据')
    for en in tqdm(entity):
        create_node(driver, type, en)

# 导入疾病类实体（包含详细的属性信息）
def import_disease_data(driver, type, entity):
    """
    疾病实体导入函数，包含更多描述性属性
    
    Args:
        driver: Neo4j 驱动实例
        type: 节点标签类型 (通常为 '疾病')
        entity: 包含疾病详细信息的字典列表
    """
    print(f'正在导入{type}类数据')
    for disease in tqdm(entity):
        order = """
        CREATE (n:%s {
            名称: $name,
            疾病简介: $desc,
            疾病病因: $cause,
            预防措施: $prevent,
            治疗周期: $cure_lasttime,
            治愈概率: $cured_prob,
            疾病易感人群: $easy_get
        })
        """ % type
        with driver.session() as session:
            session.run(order,
                       name=disease["名称"],
                       desc=disease["疾病简介"],
                       cause=disease["疾病病因"],
                       prevent=disease["预防措施"],
                       cure_lasttime=disease["治疗周期"],
                       cured_prob=disease["治愈概率"],
                       easy_get=disease["疾病易感人群"])

# 创建所有实体间的关系
def create_all_relationship(driver, all_relationship):
    """
    建立节点之间的关联关系
    
    Args:
        driver: Neo4j 驱动实例
        all_relationship: 关系列表，每个元素为 (源节点标签, 源节点名称, 关系类型, 目标节点标签, 目标节点名称)
    """
    def create_relationship(driver, type1, name1, relation, type2, name2):
        # 匹配两个节点并创建指定类型的关系
        order = """match (a:%s{名称:"%s"}),(b:%s{名称:"%s"}) create (a)-[r:%s]->(b)""" % (type1, name1, type2, name2, relation)
        with driver.session() as session:
            session.run(order)
    print("正在导入关系.....")
    for type1, name1, relation, type2, name2 in tqdm(all_relationship):
        create_relationship(driver, type1, name1, relation, type2, name2)

if __name__ == "__main__":
    # 配置命令行参数，用于连接数据库
    parser = argparse.ArgumentParser(description="通过 medical.json 文件创建一个医疗知识图谱")
    parser.add_argument('--website', type=str, default='http://localhost:7474', help='Neo4j 浏览器访问地址')
    parser.add_argument('--user', type=str, default='neo4j', help='Neo4j 用户名')
    parser.add_argument('--password', type=str, default='asd2528836683', help='Neo4j 密码')
    parser.add_argument('--dbname', type=str, default='MedRAG', help='数据库名称')
    args = parser.parse_args()

    # 初始化 Neo4j 数据库连接
    try:
        # 使用 bolt 协议连接数据库
        from neo4j import GraphDatabase
        driver = GraphDatabase.driver("bolt://localhost:7687", auth=(args.user, args.password))
        # 测试连接是否可用
        with driver.session() as session:
            session.run("RETURN 1")
        print("Neo4j 连接成功!")
        client = driver
    except Exception as e:
        print(f"Neo4j 连接失败: {e}")
        print("请检查:")
        print("1. Neo4j 服务是否已在 localhost:7687 端口启动")
        print("2. 提供的用户名和密码是否正确")
        exit(1)

    # 询问是否清空数据库，防止数据重复
    is_delete = input('注意: 是否删除 Neo4j 上的所有实体? (y/n):')
    if is_delete == 'y':
        with client.session() as session:
            # 清空所有节点及其关系
            session.run("match (n) detach delete (n)")

    # 读取清洗后的医疗数据文件
    with open('./data/medical_new_2.json','r',encoding='utf-8') as f:
        all_data = f.read().split('\n')
    
    # 初始化实体分类字典
    all_entity = {
        "疾病": [],
        "药品": [],
        "食物": [],
        "检查项目":[],
        "科目":[],
        "疾病症状":[],
        "治疗方法":[],
        "药品商":[],
    }
    
    # 解析数据并提取实体和关系
    relationship = []
    for i, data in enumerate(all_data):
        if (len(data) < 3):
            continue
        # 使用 eval 解析 JSON 行（注：由于数据格式原因，这里采用了特殊处理）
        data = eval(data[:-1])

        disease_name = data.get("name","")
        # 提取疾病详情
        all_entity["疾病"].append({
            "名称":disease_name,
            "疾病简介": data.get("desc", ""),
            "疾病病因": data.get("cause", ""),
            "预防措施": data.get("prevent", ""),
            "治疗周期":data.get("cure_lasttime",""),
            "治愈概率": data.get("cured_prob", ""),
            "疾病易感人群": data.get("easy_get", ""),
        })

        # 提取相关药品并建立“疾病-使用-药品”关系
        drugs = data.get("common_drug", []) + data.get("recommand_drug", [])
        all_entity["药品"].extend(drugs)
        if drugs:
            relationship.extend([("疾病", disease_name, "疾病使用药品", "药品", durg) for durg in drugs])

        # 提取食物推荐/禁忌
        do_eat = data.get("do_eat",[])+data.get("recommand_eat",[])
        no_eat = data.get("not_eat",[])
        all_entity["食物"].extend(do_eat+no_eat)
        if do_eat:
            relationship.extend([("疾病", disease_name,"疾病宜吃食物","食物",f) for f in do_eat])
        if no_eat:
            relationship.extend([("疾病", disease_name, "疾病忌吃食物", "食物", f) for f in no_eat])

        # 提取所需检查项目
        check = data.get("check", [])
        all_entity["检查项目"].extend(check)
        if check:
            relationship.extend([("疾病", disease_name, "疾病所需检查", "检查项目", ch) for ch in check])

        # 提取所属科室
        cure_department = data.get("cure_department", [])
        all_entity["科目"].extend(cure_department)
        if cure_department:
            relationship.append(("疾病", disease_name, "疾病所属科目", "科目", cure_department[-1]))

        # 提取症状信息
        symptom = data.get("symptom", [])
        for i, sy in enumerate(symptom):
            if symptom[i].endswith('...'):
                symptom[i] = symptom[i][:-3]
        all_entity["疾病症状"].extend(symptom)
        if symptom:
            relationship.extend([("疾病", disease_name, "疾病的症状", "疾病症状", sy) for sy in symptom])

        # 提取治疗方法
        cure_way = data.get("cure_way", [])
        if cure_way:
            for i, cure_w in enumerate(cure_way):
                if(isinstance(cure_way[i], list)):
                    cure_way[i] = cure_way[i][0]
            cure_way = [s for s in cure_way if len(s) >= 2]
            all_entity["治疗方法"].extend(cure_way)
            relationship.extend([("疾病", disease_name, "治疗的方法", "治疗方法", cure_w) for cure_w in cure_way])
            

        # 提取并发症
        acompany_with = data.get("acompany", [])
        if acompany_with:
            relationship.extend([("疾病", disease_name, "疾病并发疾病", "疾病", disease) for disease in acompany_with])

        # 提取药品商信息
        drug_detail = data.get("drug_detail", [])
        for detail in drug_detail:
            lis = detail.split(',')
            if(len(lis) != 2):
                continue
            p, d = lis[0], lis[1]
            all_entity["药品商"].append(d)
            all_entity["药品"].append(p)
            relationship.append(('药品商', d, "生产", "药品", p))

    # 数据去重
    relationship = list(set(relationship))
    all_entity = {k: (list(set(v)) if k != "疾病" else v) for k, v in all_entity.items()}
    
    # 将提取的关系保存到本地文件，方便核对
    with open("./data/rel_aug.txt", 'w', encoding='utf-8') as f:
        for rel in relationship:
            f.write(" ".join(rel))
            f.write('\n')

    # 将各类实体保存到本地 txt 文件
    if not os.path.exists('data/ent_aug'):
        os.mkdir('data/ent_aug')
    for k, v in all_entity.items():
        with open(f'data/ent_aug/{k}.txt', 'w', encoding='utf8') as f:
            if(k != '疾病'):
                for i, ent in enumerate(v):
                    f.write(ent+('\n' if i != len(v)-1 else ''))
            else:
                for i, ent in enumerate(v):
                    f.write(ent['名称']+('\n' if i != len(v)-1 else ''))

    # 执行导入操作
    for k in all_entity:
        if k != "疾病":
            import_entity(client, k, all_entity[k])
        else:
            import_disease_data(client, k, all_entity[k])
    # 创建关系
    create_all_relationship(client, relationship)

    

    

    
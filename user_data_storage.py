import json
import os

"""
用户数据存储模块
负责管理用户凭据（用户名、密码、管理员权限）的持久化存储。
当前采用简单的 JSON 文件进行存储。
"""

class Credentials:
    """
    用户凭据类，用于表示单个用户的信息。
    """
    def __init__(self, username, password, is_admin=False):
        self.username = username
        self.password = password
        self.is_admin = is_admin

    def to_dict(self):
        """将对象转换为字典，便于 JSON 序列化"""
        return {
            'username': self.username,
            'password': self.password,
            'is_admin': self.is_admin
        }

def create_folder_if_not_exist(folder):
    """如果文件夹不存在则创建"""
    if not os.path.exists(folder):
        os.makedirs(folder)

def read_credentials(file_path):
    """
    从指定 JSON 文件读取所有用户凭据。
    
    Returns:
        dict: 用户名到 Credentials 对象的映射。
    """
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            data = json.load(file)
            return {k: Credentials(**v) for k, v in data.items()}
    except (FileNotFoundError, json.JSONDecodeError):
        # 如果文件不存在或格式错误，返回空字典
        return {}

def write_credentials(file_path, credentials_dict):
    """
    将用户凭据字典保存到指定 JSON 文件中。
    """
    data = {k: v.to_dict() for k, v in credentials_dict.items()}
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

# 数据存储配置
storage_folder = "tmp_data"
storage_file = os.path.join(storage_folder, "user_credentials.json")

# 初始化存储环境
create_folder_if_not_exist(storage_folder)

# 加载现有用户数据
credentials = read_credentials(storage_file)

# 系统初始化：如果用户库为空，自动创建一个默认管理员账号
if not credentials:
    admin = Credentials("admin", "admin123", True)
    credentials['admin'] = admin
    write_credentials(storage_file, credentials)

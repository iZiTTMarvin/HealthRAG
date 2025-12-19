import os
import sys
from typing import Dict, Optional

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from user_data_storage import Credentials, credentials, storage_file, write_credentials


class AuthService:
    def __init__(self):
        self._credentials: Dict[str, Credentials] = credentials

    def register(self, username: str, password: str) -> Dict[str, str]:
        if username in self._credentials:
            return {"ok": "false", "message": "用户名已存在，请使用其他用户名。"}
        new_user = Credentials(username, password, False)
        self._credentials[username] = new_user
        write_credentials(storage_file, self._credentials)
        return {"ok": "true", "message": "注册成功，请登录。"}

    def login(self, username: str, password: str) -> Dict[str, str]:
        user_cred: Optional[Credentials] = self._credentials.get(username)
        if user_cred and user_cred.password == password:
            role = "admin" if user_cred.is_admin else "user"
            return {"ok": "true", "message": "登录成功", "role": role}
        return {"ok": "false", "message": "用户名或密码错误，请重新输入。"}

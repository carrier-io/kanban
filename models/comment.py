from plugins.shared_orch.app_objects import db
from .mixins import BaseModelMixin


class Comment(BaseModelMixin, db.Model):
    __tablename__ = "kanban_comments"
    issue_hash_id = db.Column(db.String(64), nullable=False)
    author_id = db.Column(db.Integer, nullable=True)
    comment = db.Column(db.Text)
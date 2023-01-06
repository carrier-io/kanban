import os
from sqlalchemy import event

from tools import db_orch as db
from .mixins import BaseModelMixin


class Attachment(BaseModelMixin, db.Model):
    __tablename__ = "kanban_attachments"
    issue_hash_id = db.Column(db.String(64), nullable=False)
    file_name = db.Column(db.String(300), nullable=False)
    url = db.Column(db.String(256), nullable=False, unique=True)
    full_path = db.Column(db.String(256), nullable=False, unique=True)


@event.listens_for(Attachment, 'after_delete')
def receive_after_delete(mapper, connection, target):
    if target.full_path and os.path.isfile(target.full_path):
        os.remove(target.full_path)

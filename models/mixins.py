from datetime import datetime
from tools import db_orch as db


class BaseModelMixin(object):
    id = db.Column(db.Integer, primary_key=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow(), onupdate=datetime.utcnow())
    created_at = db.Column(db.DateTime, default=datetime.utcnow())

    def __repr__(self):
        return '<%s %r>' % (self.__class__.__name__, self.id)


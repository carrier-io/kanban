from datetime import datetime
from sqlalchemy import Column, Integer, DateTime


class BaseModelMixin(object):
    id = Column(Integer, primary_key=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return '<%s %r>' % (self.__class__.__name__, self.id)


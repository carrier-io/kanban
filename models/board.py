from sqlalchemy import Column, Integer, String, ForeignKey, ARRAY, JSON
from sqlalchemy.orm import relationship
from tools import db

from .mixins import BaseModelMixin


class Board(BaseModelMixin, db.Base):
    __tablename__ = "kanban_boards"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, nullable=False)
    name = Column(String(80), nullable=False)
    hash_id = Column(String(64), nullable=False)
    tickets_url = Column(String(500), nullable=False)
    state_update_url = Column(String(500), nullable=False)
    mapping_field = Column(String(150), nullable=False)
    ticket_name_field = Column(String(150), nullable=False)
    ticket_id_field = Column(String(150), nullable=False)
    event_list_url = Column(String(500), nullable=True)
    event_detail_url = Column(String(500), nullable=True)
    tickets_attributes = Column(ARRAY(String(64)), default=[])
    engagement = Column(String(64), nullable=True, default=None)
    schedules = Column(ARRAY(JSON), nullable=True, default=[])
    columns = relationship("BoardColumn", backref='board', cascade="all,delete", lazy=False)


    def to_json(self) -> dict:
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "hash_id": self.hash_id,
            "tickets_url": self.tickets_url,
            "state_update_url": self.state_update_url,
            "mapping_field": self.mapping_field,
            "ticket_name_field": self.ticket_name_field,
            "ticket_id_field": self.ticket_id_field,
            "event_list_url": self.event_list_url,
            "event_detail_url": self.event_detail_url,
            "tickets_attributes": self.tickets_attributes,
            "engagement": self.engagement,
            "schedules": self.schedules,
            "columns": [
                {
                    "id": col.id,
                    "board_id": col.board_id,
                    "name": col.name,
                    "order": col.order,
                } for col in self.columns
            ]
        }


class BoardColumn(BaseModelMixin, db.Base):
    __tablename__ = "kanban_board_columns"
    board_id = Column(Integer, ForeignKey('kanban_boards.id'), nullable=False)
    name = Column(String(80), nullable=False)
    order = Column(Integer, nullable=False)

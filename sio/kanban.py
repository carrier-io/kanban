#!/usr/bin/python3
# coding=utf-8

#   Copyright 2022 getcarrier.io
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

""" SIO """

from pylon.core.tools import log  # pylint: disable=E0611,E0401
from pylon.core.tools import web  # pylint: disable=E0611,E0401

from tools import auth  # pylint: disable=E0401


class SIO:  # pylint: disable=E1101,R0903
    """
        SIO Resource
        self is pointing to current Module instance
        web.sio decorator takes one argument: event name
        Note: web.sio decorator must be the last decorator (at top)
        SIO resources use sio_check auth decorator
        auth.decorators.sio_check takes the following arguments:
        - permissions
        - scope_id=1
    """


    @web.sio("board_event")
    # @auth.decorators.sio_check(["global_view"])
    def sio_board_event(self, sid, data):  # pylint: disable=R0201
        """ Board Event handler """
        log.info("SIO: Data from client: [%s] %s", sid, data)
        event_name = data.get('event_name')
        #
        if not event_name:
            return log.error("Firing event error: Missing event_name field")
        #
        self.context.event_manager.fire_event(event_name)

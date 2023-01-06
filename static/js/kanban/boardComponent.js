const kanbanBoard = {
    delimiters: ['[[', ']]'],
    props: ['board', 'edit_modal_id'],
    data() {
        return {
            tickets: {},
            all_items: {},
            currentTicket: null,
            kanbanObject: null,
            list_url: null,
        }
    },
    watch: {
        board: async function(){
            $('#board').empty()
            if(!this.all_items[this.list_url]){
                await this.fetchItems()
            }
            this.populateTickets()
            this.createKanbanBoard()
        }
    },
    methods: {
        uuidv4() {
            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
              (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        },


        createKanbanBoard(){
            boards = []
            // filling boards
            this.board.columns.forEach(column => {
                internalName = this.getInternalColumnName(column.name)
                boards.push({
                    id: `${column.id}`,
                    title: column.name,
                    class: "bg-primary, text-white",
                    item: this.tickets[internalName],
                })
            });

            this.kanbanObject = new jKanban({
                element: `#board`,
                responsivePercentage: true,
                boards: boards
            });
            this.addBoardEventHandlers()
        },

        getAttribute(obj, field){
            let objCopy = Object.assign({}, obj)
            attrs = field.split('.')
            attrs.forEach(attr => objCopy = objCopy[attr])
            return objCopy
        },

        setAttribute(obj, field, value){
            attrs = field.split('.')
            for(let i=0; i<attrs.length; i++){
                attr = attrs[i]
                if (i === attrs.length - 1){
                    obj[attr] = value
                    break
                }
                obj = obj[attr]
            }
        },

        getTicket(id, internalName){
            tickets = this.tickets[internalName]
            if (tickets === undefined)
                return null

            tickets = tickets.filter(ticket => ticket['id'] === id)
            if (tickets.length === 0)
                return null
            
            return tickets[0]
        },


        populateTickets(){
            this.RESET_TICKETS_MAP(this.board.columns)
            this.all_items[this.list_url].forEach(issue => {
                title = `${this.getAttribute(issue, this.board.ticket_name_field)}`;
                state = this.getAttribute(issue, this.board.mapping_field)
                if (state in this.tickets){
                    this.tickets[state].push(
                        {
                            id: `${this.getAttribute(issue, this.board.ticket_id_field)}`,
                            title: this.generateCardElement(title),
                        }
                    )
                }
            });
        },
        

        generateCardElement(title){
            return `<div class="card">
            <div class="card-body">
              <p class="card-text">${title}</p>
            </div>
          </div>`
        },

        generateColumnsOptions(columns){
            txt = ''
            columns.forEach( column => {
                internalName = this.getInternalColumnName(column.name)
                txt += `<option value="${internalName}">${column.name}</option>`
            })
            return txt
        },

        generateEventInputs(events, isNew=false){
            result = ""
            events.forEach((event, i) => {
                result += `
                <form data-eid="${event['id']}" data-new="${isNew}">
                    <div class="row">
                    <div class="col">
                        <div class="form-group">
                            <label>Select source column</label>
                            <select class="form-control event-modal-columns-select" name='old_value' id="source_column__${i}">
                            </select>
                        </div>
                    </div>
                    <div class="col">
                        <div class="form-group">
                            <label>Select target column</label>
                            <select class="form-control event-modal-columns-select" name='new_value' id="target_column__${i}">
                            </select>
                        </div>
                    </div>
                    <div class="col">
                        <div class="form-group">
                            <label>Event name</label>
                            <input class="form-control" type="text" name='event_name' id="name__${i}">
                        </div>
                    </div>
                    <div class="col pt-4">
                        <div class="form-group">
                            <button type="button" class="btn btn-4 btn-secondary event-delete"><i class="fas fa-trash-alt"></i></button>
                            <button type="button" class="btn btn-4 btn-secondary event-save-btn">Save</button> 
                        </div>
                    </div>
                </div>
                </form>`
            })
            return result
        },

        populateEventFields(events, formTag, isNew=false){
            tags = this.generateEventInputs(events, isNew)
            formTag.append(tags)
            $(".event-modal-columns-select").empty()
            txt = this.generateColumnsOptions(this.board.columns)
            $(".event-modal-columns-select").append(txt)
            this.setEventFields()
        },

        addEventField(formTag){
            this.populateEventFields([{'id':this.uuidv4()}], formTag, true)
        },

        removeEventFields(count, parentElId){
            for(let i=0; i<count; i++){
                $(`${parentElId} > div:last-child`).remove()
            }   
        },

        setEventFields(){
            this.board.events.forEach((event, index) => {
                $(`#name__${index}`).val(event.event_name)
                $(`#target_column__${index}`).val(event.new_value)
                $(`#source_column__${index}`).val(event.old_value)
            });
        },

        getInternalColumnName(column){
            return column.toUpperCase().trim().replaceAll(' ', "_")
        },

        getInternalColumnNameFromId(columnId){
            result = this.board.columns.filter(column => column.id == columnId)
            return result.length > 0 ? this.getInternalColumnName(result[0]['name']) : null
        },

        getColumnIdFromName(columnInternalName){
            result = this.board.columns.filter(column => {
                return this.getInternalColumnName(column.name) == columnInternalName
            })
            return result.length > 0 ? result[0]['id'] : null
        },

        getEventName(sourceId, targetId){
            result = this.board.events.filter(e => {
                return e.source_column == sourceId && e.target_column == targetId
            })
            return  result.length>0 ? result[0]['name'] : null
        },

        addBoardEventHandlers(){
            this.kanbanObject.options.dropEl = (el, target, source) => {
                sourceId = source.parentElement.getAttribute('data-id')
                targetId = target.parentElement.getAttribute('data-id')
                $("#ticketConfModal").modal('show');
                $('#move-btn').unbind('click')
                $('#no-move-btn').unbind('click')
                $('#move-btn').on('click',  () => {
                    $("#ticketConfModal").modal('hide');

                    // change status of issue below                    
                    state = this.getInternalColumnNameFromId(targetId)
                    oldState = this.getInternalColumnNameFromId(sourceId)
                    id = el.dataset.eid
                    url = this.board.state_update_url + '/' + id
                    payload = {}
                    payload[this.board.mapping_field] = state
                    axios.put(url, payload)
                        .then(() => {
                            showNotify("SUCCESS", "Ticket moved")
                            this.UPDATE_ITEM_MAPPING_FIELD(id, state)
                            this.UPDATE_TICKET_MAPPING_FIELD(id, oldState, state)
                        })
                        .catch(error => {
                            data = error.response.data
                            showNotify("ERROR", data['error'])
                        })

                    // notification to teams
                    socket.emit("issue_moved", {
                        id: el.dataset.eid,
                        title: el.innerHTML,
                        targetId: targetId
                    });

                    eventName = this.getEventName(sourceId, targetId)
                    if (eventName){
                        socket.emit("board_event", {
                            'event_name': eventName,
                            'board_id': this.board.id,
                            'ticket_id': el.dataset.eid
                        });
                    }

                });
                $('#no-move-btn').on('click', () => {
                    this.kanbanObject.removeElement(el.dataset.eid)
                     let elementObject = {
                        id: `${el.dataset.eid}`,
                        title: `${el.innerHTML}`,
                    }
                    this.kanbanObject.addElement(sourceId, elementObject, 0)
                });
            };

            this.kanbanObject.options.click = async el => {
                //this from vue
                issueId = el.dataset.eid
                $('#ticketDetailModal').data('issue-id', issueId)
                items = this.all_items[this.list_url]
                this.currentTicket = items.filter(ticket => ticket['id'] == issueId)
                create_table_body(this.currentTicket);

                response = await axios.get(attachmentsUrl+"/"+issueId)
                this.attachments = response.data['items']
                createAttachments(this.attachments);

                response = await axios.get(comments_url+"/"+issueId)
                this.comments = response.data['items']
                populateComments(this.comments)
                $("#ticketDetailModal").modal('show');
            };
        },

        prepareListUrl(){
            searchTxt = document.location.search
            this.list_url = this.board.tickets_url
            if (searchTxt.length!=0){
                this.list_url += searchTxt
            }
        },

        async fetchItems(){
            const response = await axios.get(this.list_url)
            this.all_items[this.list_url] = response.data['rows']
        },

        async fetchEvents(){
            url = this.board.event_list_url
            const resp = await axios.get(url)
            this.board.events = resp.data['items'] 
        },

        RESET_TICKETS_MAP(columns){
            this.tickets = {}
            columns.forEach(col => {
                col = this.getInternalColumnName(col.name)
                this.tickets[col] = []
            });
        },

        UPDATE_ITEM_MAPPING_FIELD(id, value){
            queryUrl = this.list_url
            items = this.all_items[queryUrl].filter(item => item['id'] == id)
            if (items.length == 0) 
                return
            
            item = items[0]
            this.setAttribute(item, this.board.mapping_field, value)
    
        },

        UPDATE_TICKET_MAPPING_FIELD(id, oldValue, newValue){
            ticket = this.getTicket(id, oldValue)
            if (ticket == null){
                return
            }
            this.moveTicketAmongTicketsLists(ticket, oldValue, newValue)
        },

        REMOVE_EVENT(id){
            ind = this.board.events.findIndex(event => event.id == id)
            if (ind == -1){
                return
            }
            this.board.events.splice(ind, 1)
        },

        ADD_EVENT(event){
            this.board.events.push(event)
        },

        UPDATE_EVENT(event){
            ind = this.board.events.findIndex(e => e.id == event.id)
            if (ind == -1){
                return
            }
            this.board.events[ind] = event
        },

        moveTicketAmongTicketsLists(ticket, firstListName, secondListName){
            this.tickets[secondListName].push(ticket)
            ind = this.tickets[firstListName].findIndex(t => t.id == ticket.id)
            this.tickets[firstListName].splice(ind, 1)
        },

        deleteEventHandler(event){
            eventId = event.target.closest("[data-eid]").dataset.eid;
            isNew = $(`form[data-eid="${eventId}"]`).data('new')
            if (isNew==true){
                return $('.event-delete').closest(`form[data-eid="${eventId}"]`).remove()
            }
            url = this.board.event_detail_url + '/' + eventId
            axios.delete(url)
                .then(() => {
                    showNotify("SUCCESS")
                    $(`form[data-eid=${eventId}]`).remove()
                    this.REMOVE_EVENT(eventId)
                .catch(error => {
                    data = error.response.data
                    showNotify("ERROR", data['error'])
                })

            })
        },

        saveEventHandler(event){
            eventId = event.target.closest("[data-eid]").dataset.eid;
            innerFormTag = $(`form[data-eid="${eventId}"]`)
            isNew = innerFormTag.data('new')
            payload = innerFormTag.serializeObject();
            payload['field'] = this.board.mapping_field
            if (isNew==false){
                url = this.board.event_detail_url + '/' + eventId
                axios.put(url, payload)
                    .then(resp => {
                        if (resp.data['ok'] == true){
                            showNotify("SUCCESS", 'Updated event')
                            payload['id'] = eventId
                            this.UPDATE_EVENT(payload)
                        }
                    })
                    .catch(error => {
                        data = error.response.data
                        showNotify("ERROR", data['error'])
                    })
                return
            }
            axios.post(this.board.event_list_url, payload)
                .then(resp => {
                    event = resp.data['item']
                    showNotify("SUCCESS", 'Created event')
                    innerFormTag.data('new', false)
                    innerFormTag.attr('data-eid', event['id'])
                    this.ADD_EVENT(event)
                })
                .catch(error => {
                    data = error.response.data
                    showNotify("ERROR", data['error'])
                })

        }

    },
    template: `<div class="card card-table-sm my-3 p-3">
        <div class="card-header">
           <div class="row">
             <div class="col-8">
                  <h4>[[ board.name ]]</h4>
             </div>
             <div class="col-4">
                <div class="d-flex justify-content-end">
                    <button class="btn btn-secondary mr-2" data-toggle="modal" data-target="#kanban_event_modal" id="event-btn">
                        <i class="fa fa-plus mr-2"></i>
                        Events
                    </button>
                    <button type="button" class="btn btn-32 btn-secondary" data-toggle="modal" :data-target="edit_modal_id">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-32 btn-secondary" @click="$emit('deleteBoard', board.id)">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div> 
             </div>
            <div class="d-flex justify-content-end">
            </div>
          </div>
        </div>
        <div class="card-body card-tableless">
         <div id="board">
         </div>
        </div>
    </div>`,


    async mounted(){
        this.prepareListUrl()
        await this.fetchItems()
        await this.fetchEvents()

        this.populateTickets()
        this.createKanbanBoard()

        $("#event-btn").click(() => {
            $("#form-event").get(0).reset();
            $("#form-event").empty()
        });

        $("#kanban_event_modal").on('show.bs.modal',() => {
            formTag = $("form#form-event")
            start = 0
            count = this.board.events.length
            this.populateEventFields(this.board.events, formTag)
            $('.event-delete').on('click', event => this.deleteEventHandler(event));
            $('.event-save-btn').on('click', event => this.saveEventHandler(event));
        });

        $("#add-event-btn").click(() => {
            formTag = $("form#form-event")
            this.addEventField(formTag)
            $(".event-delete").unbind('click')
            $(".event-save-btn").unbind("click")
            $(".event-delete").on('click', event => this.deleteEventHandler(event));
            $(".event-save-btn").on("click", event => this.saveEventHandler(event));
        })

        socket.on("board_event_result", data => {
            if(data['ok']==false){
                return showNotify("ERROR", data['error'])
            }
            showNotify("SUCCESS", data['msg'])
        })

        socket.on('ticket_updated', data => {
            if (data['field'] != this.board.mapping_field)
                return

            sourceId = this.getColumnIdFromName(data['old_value'])
            targetId = this.getColumnIdFromName(data['new_value'])
            sourceInternalName = this.getInternalColumnName(data['old_value'])

            ticket = this.getTicket(data['id'], sourceInternalName)
            if (ticket == null)
                return
            
            this.kanbanObject.removeElement(ticket['id'])

            let elementObject = {
               id: `${ticket['id']}`,
               title: `${ticket['title']}`,
            }
           
           this.kanbanObject.addElement(targetId, elementObject, 0)
           this.moveTicketAmongTicketsLists(ticket, data['old_value'], data['new_value'])
        })
    }
}

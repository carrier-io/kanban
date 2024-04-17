const kanbanBoard = {
    delimiters: ['[[', ']]'],
    components: {
        'ticket-view-modal': TicketViewModal,
    },
    emits: ['ticketSelected', 'boardUrlChanged'],
    props: {
        board: {},
        updatedTicket:{},
        engagement: {},
        queryUrl: {
            default: null,
        },
    },
    data() {
        return {
            tickets: {},
            all_items: {},
            all_events: {},
            current_events: null,
            currentTicket: null,
            kanbanObject: null,
            list_url: null,

            debouncedCreateBoard: null,

            // infinite scrolling vars
            isLoading: false,
            offset: 0,
            limit: 10,

            currentObserver: null,
            zIndexOn: false,
        }
    },
    computed: {
        event_parameters(){
            return EventParamsTable.Manager('kanban_event_modal_events_params')
        },

        isUnderEngagement(){
            return this.engagement.id != -1
        },

        observer() {
            var options = {
                threshold: 0,
            };

            let callback = (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        $(entry.target).css("height", $(entry.target).height())
                        entry.target.children.forEach(child => {
                            child.style.display = "none"
                        })

                    } else {
                        $(entry.target).css("height", "")
                        entry.target.children.forEach(child => {
                            child.style.display = "block";
                        })
                    }
                })
            };
            if (this.currentObserver!=null){
                return this.currentObserver
            }
            this.currentObserver = new IntersectionObserver(callback, options);
            return this.currentObserver
        },
    },
    watch: {
        async board(newBoard){
            if(!newBoard)
                return
            if (!this.all_events[this.board.event_list_url]){
                await this.fetchEvents()
            }
            this.setCurrentEvents()
            this.$emit('boardUrlChanged', newBoard.tickets_url)
        },

        async queryUrl(value){
            if (!value)
                return
            this.list_url = value
            await this.fetchItems()
            this.populateTickets()
            this.createKanbanBoard()
        },

        updatedTicket(value){
            this.handleTicketChange(value)
        }
    },
    methods: {
        scrollToTop(){
            window.scrollTo({top: 0, behavior: "smooth"});
        },

        debounce(func, delay) {
            let timer;
            
            return function(...args) {
              clearTimeout(timer);
              
              timer = setTimeout(() => {
                func.apply(this, args);
              }, delay);
            };
        },

        updateObservedElements() {
            const elements = document.querySelectorAll('.kanban-item');
            
            elements.forEach((element) => {
              if (this.isElementNearViewport(element, 100)) {
                this.observer.observe(element);
              } else {
                this.observer.unobserve(element);
              }
            });
        },
          
        isElementNearViewport(element, offset = 0) {
            const elementRect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
          
            // Calculate the top and bottom boundaries of the viewport
            const viewportTop = 0;
            const viewportBottom = viewportHeight;
          
            // Calculate the top and bottom boundaries of the element with the specified offset
            const elementTop = elementRect.top - offset;
            const elementBottom = elementRect.bottom + offset;
          
            // Check if the element is near the viewport
            const isNearViewport = elementBottom >= viewportTop && elementTop <= viewportBottom;
          
            return isNearViewport;
        },

        createKanbanBoard(){
            $('#board').empty()
            this.offset = 0;
            boards = []
            // filling boards
            this.board.columns.forEach(column => {
                internalName = this.getInternalColumnName(column.name)
                boards.push({
                    id: `${column.id}`,
                    title: column.name,
                    item: this.tickets[internalName],
                })
            });
            if (document.querySelector('#board')){
                this.kanbanObject = new jKanban({
                    element: `#board`,
                    responsivePercentage: true,
                    boards: boards,
                });
                $('.kanban-board').css({'margin-left': '4px', 'margin-right': '4px'})
                this.setBoardsHeight()
                this.addBoardEventHandlers()
            }
        },

        setBoardsHeight(){
            maxHeight = 0
            $('main.kanban-drag').each(function(index){
                currentHeight = 0
                ticketsCount = $(this).children().length;
                $(this).children().each(function(){
                    currentHeight += parseInt($(this).css('height').replace('px', ''))
                })
                currentHeight += ticketsCount * 8;
                maxHeight = maxHeight < currentHeight ? currentHeight : maxHeight
            })
            $('main.kanban-drag').css('height', maxHeight + 'px')
        },

        getTicketPositionInColumn(columnId, ticketId){
            tickets = $(`.kanban-board[data-id="${columnId}"] main.kanban-drag`).children().toArray();
            return tickets.findIndex(el => $(el).data('eid')==ticketId)
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
            if (tickets === undefined){
                return null
            }
            tickets = tickets.filter(ticket => ticket['id'] == id)
            if (tickets.length === 0){
                return null
            }
            return tickets[0]
        },

        populateTickets(){
            this.RESET_TICKETS_MAP(this.tickets, this.board.columns)
            this.all_items[this.list_url].forEach(issue => {
                title = `${this.getAttribute(issue, this.board.ticket_name_field)}`;
                column = this.getAttribute(issue, this.board.mapping_field)
                column = this.getInternalColumnName(column)
                if (column in this.tickets){
                    this.tickets[column].push(
                        {
                            id: `${this.getAttribute(issue, this.board.ticket_id_field)}`,
                            title: this.generateCardElement(issue, title),
                        }
                    )
                }
            });
        },

        generateTickets(items){
            tickets = {}
            this.RESET_TICKETS_MAP(tickets, this.board.columns)
            items.forEach(item => {
                title = `${this.getAttribute(item, this.board.ticket_name_field)}`;
                column = this.getAttribute(item, this.board.mapping_field);
                column = this.getInternalColumnName(column)
                if (column in tickets){
                    tickets[column].push(
                        {
                            id: `${this.getAttribute(item, this.board.ticket_id_field)}`,
                            title: this.generateCardElement(item, title),
                        }
                    )
                }
            })
            return tickets
        },
        
        generateCardElement(issue, title){
            severityClass = `${issue.severity}-card`
            displayFn = field => {
                return this.board.tickets_attributes.includes(field) ? '' : 'none' 
            }
            getTags = tags => {
                return tags.reduce(function(acc, curr){
                    return acc + `
                        <div class="ticket-tag" style="border-color:${curr.color}">
                            <span class="tag-text" style="color:${curr.color}">${curr.tag}</span>
                        </div>`
                }, '')
            }

            return `
            <div class="card ticket-card ${severityClass}">
                <div class="card-row">
                    <span class="ticket-type" style="display:${displayFn('type')}">${issue.type}</span>
                </div>
                <div class="card-row">
                    <span class="ticket-title" style="display:${displayFn('title')}">${title}</span>
                </div>
                <div class="card-row" style="display:${displayFn('engagement')}">
                    <p class="ticket-small-text"> 
                        ${issue.engagement.name}
                    </p>
                </div>
                <div class="card-detail-row">
                    <div class="param" style="display:${displayFn('severity')}">
                        <i class="icon__18x18 icon-severity__18"></i> 
                        <span class="param-text">${issue.severity}</span>
                    </div>
                    <div class="param" style="display:${displayFn('status')}">
                        <i class="icon__18x18 icon-status__18"></i> 
                        <span class="param-text">
                            ${this.getDisplayStatusName(issue.state.value)}
                        </span>
                    </div>
                </div>
                <div class="card-detail-row" style="display:${displayFn('assignee')}">
                    <div class="param">
                        <i class="icon__18x18 icon-user"></i> 
                        <span class="param-text">${issue.assignee?.name ? issue.assignee.name : 'Not specified'}</span>
                    </div>
                </div>
                <div class="card-tags-container">
                    <div class="tag-row">
                        ${getTags(issue.tags)}
                    </div>
                </div>
            </div>`
        },

        getInternalColumnName(column){
            return column.toUpperCase().trim().replaceAll(' ', "_")
        },

        getDisplayStatusName(status){
            return status.charAt(0) + status.slice(1).toLowerCase().trim().replaceAll('_', ' ')
        },
        
        getInternalColumnNameFromId(columnId){
            result = this.board.columns.filter(column => column.id == columnId)
            return result.length > 0 ? this.getInternalColumnName(result[0]['name']) : null
        },

        getColumnIdFromName(name){
            result = this.board.columns.filter(column => {
                return this.getInternalColumnName(column.name) == this.getInternalColumnName(name)
            })
            return result.length > 0 ? result[0]['id'] : null
        },

        getEventName(sourceId, targetId){
            result = this.current_events.filter(e => {
                return e.values.old_value == sourceId && e.values.new_value == targetId
            })
            return  result.length>0 ? result[0]['event_name'] : null
        },

        addBoardEventHandlers(){
            this.kanbanObject.options.dropEl = (el, target, source) => {
                sourceId = source.parentElement.getAttribute('data-id')
                targetId = target.parentElement.getAttribute('data-id')
                ticketId = el.dataset.eid
                $("#ticketConfModal").modal('show');
                $('#move-btn').unbind('click')
                $('#no-move-btn').unbind('click')
                $('#move-btn').on('click',  () => {
                    $("#ticketConfModal").modal('hide');

                    // change status of issue below                    
                    state = this.getInternalColumnNameFromId(targetId)
                    oldState = this.getInternalColumnNameFromId(sourceId)
                    url = this.board.state_update_url + '/' + ticketId
                    
                    payload = {}
                    payload[this.board.mapping_field] = state
                    callMeta = {
                        'method':'put',
                        'url': url,
                        'payload': payload 
                    }
                    axios.post(proxyCallUrl, callMeta)
                        .then(response => {
                            statusCode = response.data['response_code']
                            if (statusCode != 200){
                                error = response.data['response']['error']
                                showNotify("ERROR", error)
                                return
                            }
                            showNotify("SUCCESS", "Ticket moved")
                            this.UPDATE_ITEM_MAPPING_FIELD(ticketId, state)
                            this.UPDATE_TICKET_MAPPING_FIELD(ticketId, oldState, state)
                            this.refreshTicket(targetId, ticketId)
                        })
                        .catch(error => {
                            data = error.response.data
                            showNotify("ERROR", data['error'])
                        })

                    // notification to teams
                    socket.emit("issue_moved", {
                        id: ticketId,
                        title: el.innerHTML,
                        targetId: targetId
                    });

                    eventName = this.getEventName(sourceId, targetId)
                    if (eventName){
                        socket.emit("board_event", {
                            'event_name': eventName,
                            'board_id': this.board.id,
                            'ticket_id': ticketId
                        });
                    }
                    this.setBoardsHeight();
                });
                $('#no-move-btn').on('click', () => {
                    this.kanbanObject.removeElement(ticketId)
                     let elementObject = {
                        id: `${ticketId}`,
                        title: `${el.innerHTML}`,
                    }
                    this.kanbanObject.addElement(sourceId, elementObject, 0)
                });
            };

            this.kanbanObject.options.click = async el => {
                issueId = el.dataset.eid
                $('#ticketDetailModal').data('issue-id', issueId)
                this.turnOffZIndeces()
                items = this.all_items[this.list_url]
                this.currentTicket = items.find(ticket => ticket['id'] == issueId)
                cardPosition = el.getBoundingClientRect().top + window.scrollY - 1.5*el.offsetHeight
                this.$emit('ticketSelected', this.currentTicket, cardPosition)
            };
        },

        getCurrentTicket(ticketId){
            items = this.all_items[this.list_url]
            return items.find(ticket => ticket['id'] == ticketId)
        },

        prepareListUrl(){
            this.list_url = this.board.tickets_url
        },

        async fetchItems(){
            querySign =  this.list_url.includes('?') ? "&" : "?"
            url = this.list_url+`${querySign}mapping_field=${this.board.mapping_field}&board_id=${this.board.id}`
            payload = {'method': 'get', 'url': url}
            const response = await axios.post(proxyCallUrl, payload)
            this.all_items[this.list_url] = response.data['response']['rows']
        },

        async fetchMoreItems(){
            querySign =  this.list_url.includes('?') ? "&" : "?"
            url = this.list_url+`${querySign}offset=${this.offset}&limit=${this.limit}&mapping_field=${this.board.mapping_field}`
            payload = {'method': 'get', 'url': url}
            const response = await axios.post(proxyCallUrl, payload)
            this.all_items[this.list_url] = this.all_items[this.list_url].concat(response.data['response']['rows'])
            return response.data['response']['rows']
        },

        async fetchEvents(){
            url = this.board.event_list_url
            payload = {'method': 'get', 'url': url}
            const proxiedResponse = await axios.post(proxyCallUrl, payload)
            data = proxiedResponse.data['response']['items']
            this.all_events[url] = data
        },

        setCurrentEvents(){
            url = this.board.event_list_url
            this.current_events = this.all_events[url]
        },

        RESET_TICKETS_MAP(tickets, columns){
            Object.keys(tickets).forEach(key => delete tickets[key]);
            columns.forEach(col => {
                col = this.getInternalColumnName(col.name)
                tickets[col] = []
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

        SET_EVENTS(events){
            this.current_events = events
        },

        moveTicketAmongTicketsLists(ticket, firstListName, secondListName){
            this.tickets[secondListName].push(ticket)
            ind = this.tickets[firstListName].findIndex(t => t.id == ticket.id)
            this.tickets[firstListName].splice(ind, 1)
        },

        saveEvent(events){
            payload = events.map(item => {
                item['field'] = this.board.mapping_field
                item['project_id'] = projectId
                return item
            });
            callMeta = {
                'method': 'post',
                'url': this.board.event_list_url,
                'payload': payload
            }
            axios.post(proxyCallUrl, callMeta)
                .then(resp => {
                    data = resp.data['response']
                    if (resp.data['response_code'] != 200){
                        this.event_parameters.setError(data['error'])
                        showNotify("ERROR", data['error'])
                        return
                    } 
                    events = data['items']
                    showNotify("SUCCESS", 'Created event')
                    $('#kanban_event_modal').modal('hide')
                    this.SET_EVENTS(events)
                })
                .catch(error => {
                    data = error.response.data
                    showNotify("ERROR", data['error'])
                })
        },

        refreshTicket(columnId, ticketId){
            currentTicket = this.getCurrentTicket(ticketId)
            title = `${this.getAttribute(currentTicket, this.board.ticket_name_field)}`;
            position = this.getTicketPositionInColumn(columnId, ticketId)
            this.kanbanObject.removeElement(ticketId)
            let elementObject = {
                id: `${this.getAttribute(currentTicket, this.board.ticket_id_field)}`,
                title: this.generateCardElement(currentTicket, title),
            }
            this.kanbanObject.addElement(columnId, elementObject, position)
        },

        handleTicketChange(payload){
            columnName = this.getAttribute(this.currentTicket, this.board.mapping_field)

            for (key in payload){
                this.setAttribute(this.currentTicket, key, payload[key])
            }

            title = `${this.getAttribute(this.currentTicket, this.board.ticket_name_field)}`;
            columnId = this.getColumnIdFromName(columnName)
            position = this.getTicketPositionInColumn(columnId, this.currentTicket.id)
            this.kanbanObject.removeElement(String(this.currentTicket.id))

            let elementObject = {
                id: `${this.getAttribute(this.currentTicket, this.board.ticket_id_field)}`,
                title: this.generateCardElement(this.currentTicket, title),
            }
            
            this.kanbanObject.addElement(columnId, elementObject, position)
        },

        async loadMoreItems(){
            if(this.isLoading){
                return
            }
            this.isLoading = true;
            this.offset += this.limit; 
            
            // show loading indicator
            try {
                items = await this.fetchMoreItems()
            } catch(e){
                showNotify("ERROR", e)
                console.log(e)
                this.offset -= this.limit;
                return
            }
            // add elements to kanban board
            tickets = this.generateTickets(items)
            for (column in tickets){
                tickets[column].forEach(ticket => {
                    columnId = this.getColumnIdFromName(column)
                    this.kanbanObject.addElement(columnId, ticket)
                })
            }
            this.isLoading = false;
        },

        turnOffZIndeces(){
            $('.kanban-board-header').css('z-index', '')
            $('.modal').css('z-index', 1050)
            $('nav.navbar').css('z-index', 1000)
            $('#boardToolbar').css('z-index', 'auto')
            this.zIndexOn = false;
        },

        turnOnZIndeces(){
            if(this.zIndexOn)
                return
            $('.kanban-board-header').css('z-index', 10000)
            $('.modal').css('z-index', 12000)
            $('nav.navbar').css('z-index', 11000)
            $('#boardToolbar').css('z-index', 10500)
            this.zIndexOn = true;
        },
    },
    created(){
        this.debouncedCreateBoard = this.debounce(this.createKanbanBoard, 130)
    },
    async mounted(){
        this.prepareListUrl()
        await this.fetchItems()
        await this.fetchEvents()

        this.setCurrentEvents()
        this.populateTickets()
        this.createKanbanBoard()

        $("#kanban_event_modal").on('show.bs.modal',() => {
            events = this.current_events.map(event => {
                return {
                    'event': event['event_name'],
                    'old_value': event?.values?.old_value,
                    'new_value': event?.values?.new_value,
                    'id': event?.id,
                }
            })
            this.event_parameters.set(events)
        });

        $("#boards-select").on('changed.bs.select', (e, clickedIndex, isSelected, previousValue) => {
            var board_id = $('#boards-select option:selected').val();
            querySign =  this.list_url.includes('?') ? "&" : "?"
            url = this.list_url+`${querySign}mapping_field=${this.board.mapping_field}&board_id=${board_id}&limit=100`
            payload = {'method': 'get', 'url': url}
            axios.post(proxyCallUrl, payload)
                .then(response => {
                    this.all_items[this.list_url] = response.data['response']['rows']
                    this.populateTickets()
                    this.createKanbanBoard()
                })
                .catch(error => {
                    console.log("error")
                    console.log(error)
                })
        });

        $("#kanban_event_modal").on('hidden.bs.modal',() => {
            this.event_parameters.clearErrors()
        });

        $('#save-events-btn').click(()=>{
            data = this.event_parameters.get()
            this.saveEvent(data)
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

        window.addEventListener('scroll', async() => {
            if($("#boardWrapper").hasClass('d-none'))
                return
            
            this.turnOnZIndeces()

            if ((window.innerHeight + Math.round(window.scrollY)) >= document.body.offsetHeight) {
                await this.loadMoreItems();
                this.setBoardsHeight()
            }
            this.debounce(this.updateObservedElements, 100)();

            if (window.pageYOffset === 0) {
                this.turnOffZIndeces()
            }
        });
    },
    template: `
        <div>
            <div id="board">
            </div>

            <div id="scroll-btn" @click="scrollToTop" class="scroll-btn">
                <i class="icon__16x16 icon__white icon-scroll-top"></i>
            </div>

        </div>
    `,
}

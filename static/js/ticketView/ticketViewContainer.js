const TicketViewContainer = {
    props: ["ticket"],
    emits: ['updated'],
    components: {
        'header-container': TicketHeaderContainer,
        'description-container': TicketDetailContainer,
        'attachments-container': TicketAttachmentsContainer,
        'comments-container': TicketCommentsContainer,
        'activity-container': TicketActivityContainer,
    },
    methods: {
        propagateEvent(data){
            newTicket = {...this.ticket}
            Object.assign(newTicket, data)
            this.$emit('updated', newTicket)
        },
        close(){
            this.$emit('updated', null)
        },
    },
    template: `
        <div class="card mt-3" style="margin: 0px">
            <div class="card-body" style="padding: 0px">
                <div class="ticket-view">
                    
                    <header-container
                        :ticket="ticket"
                        @updated="propagateEvent"
                        @close="close"
                    ></header-container>

                    <description-container
                        :ticket=ticket
                        @updated="propagateEvent"
                    >
                    </description-container>
                
                    <attachments-container
                        :ticket=ticket
                    >
                    </attachments-container>

                    <comments-container
                        :ticket=ticket
                    >
                    </comments-container>

                    <activity-container
                        :ticket=ticket
                    >
                    </activity-container>                    

                </div>
            </div>
        </div>
    `
}

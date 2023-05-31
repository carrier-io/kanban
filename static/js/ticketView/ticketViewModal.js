const TicketViewModal = {
    props: ["ticket",],
    emits: ['updated'],
    components: {
        'description-container': TicketDetailContainer,
        'attachments-container': TicketAttachmentsContainer,
        'comments-container': TicketCommentsContainer,
        'activity-container': TicketActivityContainer,
    },
    methods: {
        propagateEvent(data){
            this.$emit('updated', data)
        }
    },
    template: `
    <div id="ticketDetailModal" class="modal fixed-left fade shadow-sm" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-aside" role="document">
            <div class="modal-content">
                <div class="modal-body">
                    <div class="ticket-view">

                        <div class="ticket-header-container">
                            <div class="header">TICKET ID</div>
                            <button type="button" class="btn  btn-secondary mr-2" data-dismiss="modal" aria-label="Close">
                                Close
                            </button>
                        </div>

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
        </div>
    </div>

   
    `
}

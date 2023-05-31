const TagInput = {
    props: {
        ticketTags: {
            default: [],
        },
    },
    emits: ['updated'],
    data(){
        return {
            tagBtn: null,
            allTags: [
                {'tag': 'Business', 'color': '#2bd48d'},
                {'tag': 'System', 'color': '#f89033'},
                {'tag': 'Product', 'color':'#f32626'},
            ]
        }
    },
    computed: {
        currentTags(){
            names = this.ticketTags.map(tag => tag.tag)
            return new Set(names)
        },
    },
    methods: {
        isSelectedTag(tagName){
            return this.currentTags.has(tagName)
        },

        async fetchTags (){
            const response = await axios.get(tags_api)
            this.allTags = response.data['items']
        },

        onChange(e){
            tags = this.tagBtn.getFullSelectedValues()
            this.$emit('updated', tags)
        }
    },
    async mounted(){
        await this.fetchTags()
        selectedColor = '#5933c6';
        
        this.tagBtn = BootstrapInputsTags.init("select[multiple][data-detail-tag]", {
            selectedColor,
        });

        Coloris({
            el: '#coloris',
            themeMode: 'light',
            onChange: (color) => {
                selectedColor = color;
                this.tagBtn.changeColor(color)
            },
            swatches: [
                '#5933c6',
                '#29B8F5',
                '#2bd48d',
                '#EFE482',
                '#F89033',
                '#f32626',
            ],
        });
    },
    template:`
        <div>
            <div class="square mb-2">
                <input type="text" id="coloris" class="square" value="#5933c6">
            </div>
            <form class="needs-validation form-tags" novalidate onsubmit="event.preventDefault();">
                <select class="form-select"
                        id="validationTagsShow"
                        @change="onChange"
                        name="tags_show[]"
                        multiple
                        data-allow-new="true"
                        data-detail-tag="true"
                        data-show-all-suggestions="true"
                        data-allow-clear="true">
                    <option disabled hidden value="">Type to search or create tag</option>
                    <option 
                        :key="tag.tag" v-for="tag in allTags" 
                        :value="tag.tag" :data-style-color="tag.color" 
                        :selected="isSelectedTag(tag.tag)">
                        {{tag.tag}}
                    </option>
                </select>
                <div class="invalid-feedback">Please select a valid tag.</div>
            </form>
        </div>
    `
}
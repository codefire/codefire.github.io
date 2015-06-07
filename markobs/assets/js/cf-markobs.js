
angular.module("cf-markobs", ['cf-templates'])
    // .factory("AuthService", AuthService)
    .controller("MarkObsTestController", MarkObsTestController)
    .directive("prettyCode", CodeHighlighterDirective)
;

MarkObsTestController.$inject = ["$window", "$scope", "$sce"];
function MarkObsTestController($window, $scope, $sce) {
    var moCtrl;
    moCtrl = this;
    moCtrl.debug = "If you can see this, then MarkObsTestController is working :-)";
    moCtrl.html = '';
    moCtrl.markob = {};
    moCtrl.deletedItems = [];

    $scope.$watch("moCtrl.markob", (function (updated, previous) {
        moCtrl.html = $sce.trustAsHtml(moCtrl.generateHtmlCode());
    }), true);

    this.generateHtmlCode = function () {
        var doc = document.createElement("div");

        if (typeof(moCtrl.markob) != 'undefined') {
            if (typeof(moCtrl.markob.items) != 'undefined') {
                for (var key in moCtrl.markob.items) {
                    if (moCtrl.markob.items.hasOwnProperty(key)) {
                        var item = moCtrl.markob.items[key];
                        var tag = this.processItem(item);
                        doc.appendChild(tag);
                    }
                }
            }
        }

        var currentNode,
            ni = document.createNodeIterator(doc, NodeFilter.SHOW_ELEMENT);

        var count = 0
        var html = '';
        while(currentNode = ni.nextNode()) {
            if(count > 0){
                html += this.tagToHtml( currentNode ) + '\n';
            }
            count++;
        }

        return html;
    }

    this.processItem = function (item) {
        var tag = null;

        switch (item.type) {
            case 'heading':
                var tagName = 'h3';
                if (typeof(item.rank) != 'undefined' && item.rank >= 1 && item.rank <= 6)
                    tagName = 'h' + item.rank;

                tag = document.createElement(tagName);
                var newContent = document.createTextNode(item.content);
                tag.appendChild(newContent);
                break;
            case 'paragraph':

                tag = document.createElement('p');

                if( typeof(item.content) != 'undefined' ){
                    if(item.content != null){
                        var newContent = document.createTextNode(item.content);
                        tag.appendChild(newContent);
                    }
                }

                if(typeof(item.items) != 'undefined'){
                    if(item.items.length > 0){

                        for (var key in item.items) {
                            if (item.items.hasOwnProperty(key)) {
                               // var component = this.tagToHtml(  );
                                if( item.items[key].type == 'text' ){
                                    // var newContent = document.createTextNode(html);
                                }
                                var node = this.processItem( item.items[key] );
                                tag.appendChild( node );
                            }
                        }
                    }
                }

                break;
            case 'text':
                    tag = document.createTextNode(item.content);
                break;
            case 'link':

                var tag = document.createElement('a');
                var linkText = document.createTextNode(item.content);
                tag.appendChild(linkText);

                break;
            case 'list':

                if(item.flavour == 'ordered'){
                    tag = document.createElement('ol');
                }else{
                    tag = document.createElement('ul');
                }

                if(typeof(item.items) != 'undefined'){
                    for(var key in item.items){
                        if (item.items.hasOwnProperty(key)) {
                            tag.appendChild( this.processItem(item.items[key]) );
                        }
                    }
                }

                break;
            case 'list-item':

                tag = document.createElement('li');
                var newContent = document.createTextNode(item.content);
                tag.appendChild(newContent);

                break;
            case 'image':
                tag = document.createElement('image');
                break;
        }

        if(typeof(tag) != 'undefined' && tag != null){
            if (typeof(item.attributes) != 'undefined' && Object.keys(item.attributes).length > 0) {
                for (var key in item.attributes) {
                    if (item.attributes.hasOwnProperty(key)) {
                        tag.setAttribute(key, item.attributes[key]);
                    }
                }
            }
        }

        // console.log('tag [',typeof(tag),'] : ' , tag);

        return tag;
    }

    this.tagToHtml = function(tag, depth){

        var html = '';
        var spaces = false;

        if(typeof(tag) == 'undefined' || tag == null){
            return html;
        }

        if(typeof(tag.tagName) != 'undefined'){
            if( tag.tagName == 'A' || tag.tagName == 'a' ){
                spaces = true;
            }
        }

        if(typeof(depth) == 'undefined' || depth == null)
            depth = 0;

        if(typeof(depth) != 'undefined' && depth > 0){
            for(var i = 0; i < depth; i++){
                html += '\t';
            }
        }

        if(spaces == true)
            html += ' ';

        if (typeof(tag) == 'object'){
            if(tag.tagName == 'P') {
                if (typeof(tag.childNodes) != 'undefined' && tag.childNodes.length > 1) {

                    // @todo: attributes will go missing here
                    html += '<p>';

                    var cn = null
                    var pi = document.createNodeIterator(tag, NodeFilter.SHOW_ALL);

                    var count = 0
                    while (cn = pi.nextNode()) {
                        if (count > 0) {
                            html += this.tagToHtml(cn);
                        }
                        count++;
                    }

                    html += '</p>';

                } else {
                    var tmpParent = document.createElement("div");
                    tmpParent.appendChild(tag);
                    html += tmpParent.innerHTML;
                }
            }else if(tag.tagName == 'A'){
                var tmpParent = document.createElement("div");
                tmpParent.appendChild(tag);
                html += tmpParent.innerHTML;
            }else{
                var tmpParent = document.createElement("div");
                tmpParent.appendChild(tag);
                html += tmpParent.innerHTML;
            }
        }else{
            html += tag;
        }

        if(spaces == true)
            html += ' ';

        return html;

    }

    this.removeItem = function(index, item) {
        item.previousIndex = index;
        moCtrl.deletedItems.push(item);
        return this.markob.items.splice(index, 1);
    };
    
    this.reinstateDeleted = function(index, item) {
        var from;
        this.markob.items.push(item);
        if (typeof item.previousIndex !== 'undefined') {
            from = this.markob.items.indexOf(item);
            if (typeof from !== 'undefined' && from !== item.previousIndex) {
                this.markob.items.move(from, item.previousIndex);
            }
        }
        return moCtrl.deletedItems.splice(index, 1);
    };
    
    this.moveItemUp = function(index, item) {
        if (index === 0) {
            return false;
        }
        return this.markob.items.move(index, index - 1);
    };
    
    this.moveItemDown = function(index, item) {
        if (index === this.markob.items.length - 1) {
            return false;
        }
        return this.markob.items.move(index, index + 1);
    };



    this.setContent = function (type) {

        switch (type) {
            case 'lorem':

                moCtrl.markob = {
                    meta: {
                        version: 0.1
                    },
                    items: [
                        {
                            type: 'heading',
                            rank: 1,
                            content: 'Lorem Ipsum',
                            attributes: {
                                class: 'heading'
                            }
                        },
                        {
                            type: 'paragraph',
                            content: 'Quisque quis mollis tellus. Proin aliquam tellus vel nisl vestibulum pharetra. Ut aliquam turpis et tempor convallis. Donec ut enim in ligula efficitur faucibus in at massa. Suspendisse potenti. Aenean mattis arcu sit amet erat tempus'
                        },
                        {
                            type: 'list',
                            flavour: 'unordered',
                            items:[
                                {
                                    type: 'list-item',
                                    content: 'Sed eget suscipit sem'
                                },
                                {
                                    type: 'list-item',
                                    content: 'Etiam eleifend sodales porttitor'
                                },
                                {
                                    type: 'list-item',
                                    content: 'Pellentesque dictum porttitor nisl'
                                }
                            ]
                        },
                        {
                            type: 'paragraph',
                            content: 'Suspendisse et vestibulum ex. Integer lacinia erat sed magna commodo, eget fringilla ipsum tempus. Suspendisse potenti. Fusce aliquet ultrices interdum.'
                        },
                        {
                            type: 'image',
                            attributes:{
                                src: 'http://placehold.it/500x250',
                                alt: 'placeholder image',
                                class: 'th'
                            }
                        },
                        {
                            type: 'paragraph',
                            content: 'Morbi rhoncus justo sed dolor luctus, eu ornare nunc sollicitudin. Praesent porttitor rhoncus massa, nec finibus nibh volutpat quis.'
                        },
                        {
                            type: 'heading',
                            rank: 2,
                            content: 'Morbi vulputate, ipsum et malesuada suscipit',
                            attributes: {
                                class: 'heading'
                            }
                        },
                        {
                            type: 'paragraph',
                            content: 'Mauris rhoncus molestie ipsum, vitae blandit ante consequat egestas. Praesent nec nibh a velit pretium faucibus. Aenean aliquam vestibulum nibh, eget dapibus nunc maximus at. Donec auctor consequat ligula, eget imperdiet erat venenatis non. Maecenas rhoncus mi ex, et pretium erat malesuada ac. Aliquam sapien sapien, rhoncus id auctor sit amet, mollis vel justo. Integer posuere scelerisque arcu, ut mattis elit rutrum ut. In quis diam sapien.'
                        },
                    ]
                }

                break;
            case 'owls':

                moCtrl.markob = {
                    meta:{
                      version: 0.1
                    },
                    items:[
                        {
                            type: 'heading',
                            rank:1,
                            content:'Owl Anatomy'
                        },
                        {
                            type:'paragraph',
                            items:[
                                {
                                    type: 'text',
                                    content: 'Owls have large forward-facing eyes and ear-holes; a '
                                },
                                {
                                    type: 'link',
                                    content: 'hawk',
                                    attributes: {
                                        href: 'http://en.wikipedia.org/wiki/Hawk',
                                        title: 'Hawk'
                                    }
                                },
                                {
                                    type: 'text',
                                    content: '-like'
                                },
                                {
                                    type: 'link',
                                    content: 'beak',
                                    attributes: {
                                        href: 'http://en.wikipedia.org/wiki/Beak',
                                        title: 'Beak'
                                    }
                                },
                                {
                                    type: 'text',
                                    content: '; a flat face; and usually a conspicuous circle of feathers, a '
                                },
                                {
                                    type: 'link',
                                    content: 'facial disc',
                                    attributes: {
                                        href: 'http://en.wikipedia.org/wiki/Facial_disc',
                                        title: 'facial disc'
                                    },
                                    wrappers: ['emphasis']
                                },
                                {
                                    type: 'text',
                                    content: "around each eye. The feathers making up this disc can be adjusted in order to sharply focus sounds that come from varying distances onto the owls' asymmetrically placed ear cavities. "
                                },
                            ]
                        },
                        {
                            type: 'image',
                            attributes: {
                                src: 'http://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Athene_noctua_%28cropped%29.jpg/220px-Athene_noctua_%28cropped%29.jpg',
                                class: 'th',
                                alt: 'Little Owl'
                            }
                        },
                        {
                            type: 'paragraph',
                            items: [
                                {
                                    type: 'text',
                                    content: "Most birds of prey have eyes on the sides of their heads, but the stereoscopic nature of the owl's forward-facing eyes permits the greater sense of depth perception necessary for low-light hunting. Although owls have "
                                },
                                {
                                    type: 'link',
                                    content: 'binocular vision',
                                    attributes: {
                                        href: 'http://en.wikipedia.org/wiki/Binocular_vision',
                                        title: 'Binocular vision'
                                    }
                                },
                                {
                                    type: 'text',
                                    content: ", their large eyes are fixed in their sockets—as are those of other birds—so they must turn their entire head to change views. As owls are farsighted, they are unable to see clearly anything within a few centimeters of their eyes. Caught prey can be felt by owls with the use of "
                                },
                                {
                                    type: 'link',
                                    content: 'filoplumes',
                                    attributes: {
                                        href: 'http://en.wikipedia.org/wiki/Filoplume',
                                        title: 'Filoplumen',
                                        class: 'mw-redirect'
                                    }
                                },
                                {
                                    type: 'text',
                                    content: '—like feathers on the beak and feet that act as "feelers". Their far vision, particularly in low light, is exceptionally good.'
                                }
                            ]
                        },
                        {
                            type: 'paragraph',
                            items:[
                                {
                                    type: 'link',
                                    content: 'Thanks Wikipedia!',
                                    attributes:{
                                        href: 'http://en.wikipedia.org/wiki/Owl',
                                        title: 'Wikipedia Owls'
                                    }
                                }
                            ]
                        }
                    ]
                }

                break;
            default:

                moCtrl.markob = {
                    meta: {
                        version: 0.1
                    }
                }

                break;
        }

    }

    // default to test content
    this.setContent('lorem');
};

CodeHighlighterDirective.$inject = ["$interpolate", "$window"];
function CodeHighlighterDirective($interpolate, $window) {
    return {
        restrict: 'E',
        scope: true,
        compile: function (tElem, tAttrs) {
            var interpolateFn = $interpolate(tElem.html(), true);
            tElem.html(''); // disable automatic intepolation bindings
            return function (scope, elem, attrs) {
                scope.$watch(interpolateFn, function (value) {

                    if(attrs.class == 'html'){
                        value = html_beautify(value, {
                            'indent_inner_html': true,
                            'indent_size': 4,
                            'indent_char': ' ',
                            'wrap_line_length': 0,
                            'brace_style': 'expand',
                            'unformatted': ['a', 'sub', 'sup', 'b', 'i', 'u'],
                            'preserve_newlines': false,
                            'max_preserve_newlines': 2,
                            'indent_handlebars': false,
                            'extra_liners': ['/html']
                        });
                    }else if(attrs.class == 'json'){
                        value = js_beautify(value, {
                            'indent_size': 4,
                            'indent_char': ' ',
                            'preserve_newlines': true,
                            'max_preserve_newlines': 2
                        });
                    }

                    var result = hljs.highlightAuto(value);
                    var code = result.value;

                    elem.html(code);
                });
            }
        }
    };
}



Object.defineProperty(Array.prototype, "move", {
    enumerable: false,
    value: function(from, to) {
        this.splice(to, 0, this.splice(from, 1)[0]);
    }
});
angular.module('cf-templates', []);


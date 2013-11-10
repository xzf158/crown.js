define(['crown', 'jquery'], function(crown, $) {
    var Scheme = crown.inherit("crown.site.PaperParser", function() {});
    var proto = Scheme.prototype;
    proto.init = function(options) {};
    proto.parse = function(content) {
        var $content = typeof content === 'string' ? $('<html />').html(content) : $(content);
        return {
            data: this._findData($content),
            html: this._findHtml($content)
        };
    };
    proto._findData = function($content) {
        var data = $content.find('.document-data').html();
        if (!data) {
            var $ele = $content.find('#context-data,.context-data');
            if ($ele.length > 0) {
                var tagName = $ele.prop("tagName").toLowerCase();
                if (tagName === 'input') {
                    data = $ele.val();
                } else {
                    data = $ele.html();
                }
            }
        }
        if (data) {
            data = eval('(' + data + ')');
            if (data.title === undefined) {
                data.title = $content.find('title').html();
            }
            return data;
        } else {
            throw new Error('Can not find paper data from current page or ajax loaded content.');
        }
    };
    proto._findHtml = function($content) {
        var list = [],
            $html = $content.find('.document-html');
        if ($html.length > 0) {
            $html.children().each(function() {
                var $this = $(this),
                    container = $this.data('element-container'),
                    order = $this.data('element-order') || 0;
                list.push({
                    container: container,
                    order: order,
                    content: this
                });
            });
        } else {
            $content.find('.hn-scene-element').each(function(index) {
                var $container = $(this).parent(),
                    container = 'body',
                    id = $container.attr('id'),
                    name = $container.attr('data-name');
                if (id) {
                    container = '#' + id;
                } else if (name) {
                    container = '[data-name=' + name + ']';
                } else {
                    throw new Error('Can not find the same parent container for scene element!');
                }
                list.push({
                    container: container,
                    order: index,
                    content: this
                });
            });
        }
        return list.sort(function(a, b) {
            return a.order - b.order;
        });
    };
    return Scheme;
});

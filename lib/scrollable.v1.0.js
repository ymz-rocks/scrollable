function scrollable(selector, events)
{
    var listeners = { start: 'start', drag: 'drag', end: 'end' },
        modes = { gesture: 'gesture', scroller: 'scroller' };

    if (!events) events = { mode: modes.gesture };

    function Frame(element)
    {
        if (!element || element.length == 0) return;

        var on =
        {
            action: false,

            drag: function (axis, control, event, e)
            {
                if (!on.action) return;

                fire(axis, control, event, e);
            },

            end: function (axis, control, event, e)
            {
                if (!on.action) return;

                fire(axis, control, event, e);

                on.action = false;

            },

            start: function (axis, control, event, e)
            {
                if (on.action) return;

                on.action = control;

                fire(axis, control, event, e);
            }
        };

        function apply(mode)
        {
            var axis = element.children('.axis.' + mode);

            if (axis.length == 0) return;

            var gesture = element.children(':not([class])'),
                scroller = element.children('.' + modes.scroller + '.' + mode);

            if (gesture.length == 0 && scroller.length == 0) return;

            var pos = mode == 'x' ? 'left' : 'top',
                net = new Net(element, axis, scroller, mode),
                percent = new Percent(mode);

            gesture.dragga
            ({
                start: function (e)
                {
                    on.start(mode, modes.gesture, listeners.start, e);
                },

                drag: function (e)
                {
                    if (percent.ignore(e)) return;

                    axis.stop().css(pos, -net.content * percent.value(true));

                    scroller.css(pos, net.scroller * percent.value());

                    on.drag(mode, modes.gesture, listeners.drag, e);
                },

                end: function (e)
                {
                    var diff = percent.update(e);

                    if (!diff) return on.end(mode, modes.gesture, listeners.end, e, scroller);

                    var anim = new Object(); anim[pos] = diff < 0 ? 0 : diff > 1 ? -net.content : undefined

                    if (anim[pos] != undefined) axis.stop().animate(anim, e.time.duration * (e.time.duration > 1000 ? 1 : e.time.duration > 500 ? 2 : 3));

                    percent.fix();

                    on.end(mode, modes.gesture, listeners.end, e);
                }
            });

            scroller.dragga
            ({
                start: function (e)
                {
                    on.start(mode, modes.scroller, listeners.start, e);
                },

                drag: function (e)
                {
                    percent.refresh(e);

                    axis.stop().css(pos, -net.content * percent.current);

                    on.drag(mode, modes.scroller, listeners.drag, e);
                },

                end: function (e)
                {
                    on.end(mode, modes.scroller, listeners.end, e);
                }
            });
        }

        function fire(axis, control, event, e)
        {
            if (!events[event] || !e.user || !on.action) return;

            if (on.action != control) return (events.mode == modes.scroller || !events.mode) && event == listeners.end ? events[event](e, on.action) : undefined;

            if (events.mode && events.mode != control) return;

            if (on.action == modes.scroller && event == listeners.start) return events[event](e, on.action);

            if (!e.time.duration && !e.travel.from[axis] && !e.travel.to[axis]) return;

            if (e.active) return events[event](e, control);
        }

        apply('x');
        apply('y');
    }

    function Net(frame, axis, scroller, mode)
    {
        function max()
        {
            var last = axis.children().last(),
                pos = last.position();

            return { x: pos.left + last.outerWidth(), y: pos.top + last.outerHeight() };
        }

        var size = mode == 'x' ? 'width' : 'height',
            total = frame[size]();

        this.content = max()[mode] - total;

        this.scroller = scroller.length == 0 ? 0 : total - scroller[size]();
    }

    function Percent(mode)
    {
        var x = mode == 'x', refresh = false;

        this.last = 0;
        this.current = 0;
        this.offset = undefined;

        this.delta = function (e)
        {
            var current = e.range.value[mode]; if (current == undefined) return;

            return x ? current - this.offset : this.offset - current;
        }

        this.fix = function ()
        {
            if (this.last < 0) this.last = 0;
            else if (this.last > 1) this.last = 1;
        };

        this.ignore = function (e)
        {
            if (!this.offset)
            {
                this.offset = e.range.value[mode];

                return true;
            }
            else if (refresh)
            {
                refresh = false;
                this.last = this.current;
            }
            else this.current = this.last + this.delta(e);
        };

        this.refresh = function (e)
        {
            refresh = true; this.current = e.range.value[mode];
        };

        this.update = function (e)
        {
            var value = this.delta(e); if (!value) return;

            this.last += value;

            delete this.offset; return this.last;
        };

        this.value = function (wild)
        {
            return wild ? this.current : this.current < 0 ? 0 : this.current > 1 ? 1 : this.current;
        };
    }

    $(window).load(function ()
    {
        $(selector).each(function ()
        {
            new Frame($(this));
        });
    });
}
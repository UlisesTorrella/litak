"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chessground = void 0;
const api_1 = require("./api");
const config_1 = require("./config");
const state_1 = require("./state");
const wrap_1 = require("./wrap");
const events = require("./events");
const render_1 = require("./render");
const svg = require("./svg");
const util = require("./util");
function Chessground(element, config) {
    const maybeState = state_1.defaults();
    config_1.configure(maybeState, config || {});
    function redrawAll() {
        const prevUnbind = 'dom' in maybeState ? maybeState.dom.unbind : undefined;
        // compute bounds from existing board element if possible
        // this allows non-square boards from CSS to be handled (for 3D)
        const relative = maybeState.viewOnly && !maybeState.drawable.visible, elements = wrap_1.renderWrap(element, maybeState, relative), bounds = util.memo(() => elements.board.getBoundingClientRect()), redrawNow = (skipSvg) => {
            render_1.render(state);
            if (!skipSvg && elements.svg)
                svg.renderSvg(state, elements.svg);
        }, boundsUpdated = () => {
            bounds.clear();
            render_1.updateBounds(state);
            if (elements.svg)
                svg.renderSvg(state, elements.svg);
        };
        const state = maybeState;
        state.dom = {
            elements,
            bounds,
            redraw: debounceRedraw(redrawNow),
            redrawNow,
            unbind: prevUnbind,
            relative,
        };
        element.onwheel = (e) => {
            e.preventDefault();
            state.index = Math.min(Math.max(state.index - 1 * Math.sign(e.deltaY), 1), state.maxIndex);
            console.log(state.index);
            redrawNow();
        };
        state.drawable.prevSvgHash = '';
        redrawNow(false);
        events.bindBoard(state, boundsUpdated);
        if (!prevUnbind)
            state.dom.unbind = events.bindDocument(state, boundsUpdated);
        state.events.insert && state.events.insert(elements);
        return state;
    }
    return api_1.start(redrawAll(), redrawAll);
}
exports.Chessground = Chessground;
function debounceRedraw(redrawNow) {
    let redrawing = false;
    return () => {
        if (redrawing)
            return;
        redrawing = true;
        requestAnimationFrame(() => {
            redrawNow();
            redrawing = false;
        });
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlc3Nncm91bmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcmMvY2hlc3Nncm91bmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0JBQW1DO0FBQ25DLHFDQUE2QztBQUM3QyxtQ0FBeUQ7QUFFekQsaUNBQW9DO0FBQ3BDLG1DQUFtQztBQUNuQyxxQ0FBZ0Q7QUFDaEQsNkJBQTZCO0FBQzdCLCtCQUErQjtBQUUvQixTQUFnQixXQUFXLENBQUMsT0FBb0IsRUFBRSxNQUFlO0lBQy9ELE1BQU0sVUFBVSxHQUEwQixnQkFBUSxFQUFFLENBQUM7SUFFckQsa0JBQVMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRXBDLFNBQVMsU0FBUztRQUNoQixNQUFNLFVBQVUsR0FBRyxLQUFLLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQzNFLHlEQUF5RDtRQUN6RCxnRUFBZ0U7UUFDaEUsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLFFBQVEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUNsRSxRQUFRLEdBQUcsaUJBQVUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxFQUNwRCxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLENBQUMsRUFDaEUsU0FBUyxHQUFHLENBQUMsT0FBaUIsRUFBUSxFQUFFO1lBQ3RDLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNkLElBQUksQ0FBQyxPQUFPLElBQUksUUFBUSxDQUFDLEdBQUc7Z0JBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25FLENBQUMsRUFDRCxhQUFhLEdBQUcsR0FBUyxFQUFFO1lBQ3pCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNmLHFCQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEIsSUFBSSxRQUFRLENBQUMsR0FBRztnQkFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDO1FBQ0osTUFBTSxLQUFLLEdBQUcsVUFBbUIsQ0FBQztRQUNsQyxLQUFLLENBQUMsR0FBRyxHQUFHO1lBQ1YsUUFBUTtZQUNSLE1BQU07WUFDTixNQUFNLEVBQUUsY0FBYyxDQUFDLFNBQVMsQ0FBQztZQUNqQyxTQUFTO1lBQ1QsTUFBTSxFQUFFLFVBQVU7WUFDbEIsUUFBUTtTQUNULENBQUM7UUFFRixPQUFPLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDdEIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ25CLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMzRixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6QixTQUFTLEVBQUUsQ0FBQztRQUNkLENBQUMsQ0FBQTtRQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztRQUNoQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLFVBQVU7WUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQztRQUM5RSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxPQUFPLFdBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBL0NELGtDQStDQztBQUVELFNBQVMsY0FBYyxDQUFDLFNBQXNDO0lBQzVELElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN0QixPQUFPLEdBQUcsRUFBRTtRQUNWLElBQUksU0FBUztZQUFFLE9BQU87UUFDdEIsU0FBUyxHQUFHLElBQUksQ0FBQztRQUNqQixxQkFBcUIsQ0FBQyxHQUFHLEVBQUU7WUFDekIsU0FBUyxFQUFFLENBQUM7WUFDWixTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwaSwgc3RhcnQgfSBmcm9tICcuL2FwaSc7XG5pbXBvcnQgeyBDb25maWcsIGNvbmZpZ3VyZSB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7IEhlYWRsZXNzU3RhdGUsIFN0YXRlLCBkZWZhdWx0cyB9IGZyb20gJy4vc3RhdGUnO1xuXG5pbXBvcnQgeyByZW5kZXJXcmFwIH0gZnJvbSAnLi93cmFwJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICcuL2V2ZW50cyc7XG5pbXBvcnQgeyByZW5kZXIsIHVwZGF0ZUJvdW5kcyB9IGZyb20gJy4vcmVuZGVyJztcbmltcG9ydCAqIGFzIHN2ZyBmcm9tICcuL3N2Zyc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBDaGVzc2dyb3VuZChlbGVtZW50OiBIVE1MRWxlbWVudCwgY29uZmlnPzogQ29uZmlnKTogQXBpIHtcbiAgY29uc3QgbWF5YmVTdGF0ZTogU3RhdGUgfCBIZWFkbGVzc1N0YXRlID0gZGVmYXVsdHMoKTtcblxuICBjb25maWd1cmUobWF5YmVTdGF0ZSwgY29uZmlnIHx8IHt9KTtcblxuICBmdW5jdGlvbiByZWRyYXdBbGwoKTogU3RhdGUge1xuICAgIGNvbnN0IHByZXZVbmJpbmQgPSAnZG9tJyBpbiBtYXliZVN0YXRlID8gbWF5YmVTdGF0ZS5kb20udW5iaW5kIDogdW5kZWZpbmVkO1xuICAgIC8vIGNvbXB1dGUgYm91bmRzIGZyb20gZXhpc3RpbmcgYm9hcmQgZWxlbWVudCBpZiBwb3NzaWJsZVxuICAgIC8vIHRoaXMgYWxsb3dzIG5vbi1zcXVhcmUgYm9hcmRzIGZyb20gQ1NTIHRvIGJlIGhhbmRsZWQgKGZvciAzRClcbiAgICBjb25zdCByZWxhdGl2ZSA9IG1heWJlU3RhdGUudmlld09ubHkgJiYgIW1heWJlU3RhdGUuZHJhd2FibGUudmlzaWJsZSxcbiAgICAgIGVsZW1lbnRzID0gcmVuZGVyV3JhcChlbGVtZW50LCBtYXliZVN0YXRlLCByZWxhdGl2ZSksXG4gICAgICBib3VuZHMgPSB1dGlsLm1lbW8oKCkgPT4gZWxlbWVudHMuYm9hcmQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpLFxuICAgICAgcmVkcmF3Tm93ID0gKHNraXBTdmc/OiBib29sZWFuKTogdm9pZCA9PiB7XG4gICAgICAgIHJlbmRlcihzdGF0ZSk7XG4gICAgICAgIGlmICghc2tpcFN2ZyAmJiBlbGVtZW50cy5zdmcpIHN2Zy5yZW5kZXJTdmcoc3RhdGUsIGVsZW1lbnRzLnN2Zyk7XG4gICAgICB9LFxuICAgICAgYm91bmRzVXBkYXRlZCA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgYm91bmRzLmNsZWFyKCk7XG4gICAgICAgIHVwZGF0ZUJvdW5kcyhzdGF0ZSk7XG4gICAgICAgIGlmIChlbGVtZW50cy5zdmcpIHN2Zy5yZW5kZXJTdmcoc3RhdGUsIGVsZW1lbnRzLnN2Zyk7XG4gICAgICB9O1xuICAgIGNvbnN0IHN0YXRlID0gbWF5YmVTdGF0ZSBhcyBTdGF0ZTtcbiAgICBzdGF0ZS5kb20gPSB7XG4gICAgICBlbGVtZW50cyxcbiAgICAgIGJvdW5kcyxcbiAgICAgIHJlZHJhdzogZGVib3VuY2VSZWRyYXcocmVkcmF3Tm93KSxcbiAgICAgIHJlZHJhd05vdyxcbiAgICAgIHVuYmluZDogcHJldlVuYmluZCxcbiAgICAgIHJlbGF0aXZlLFxuICAgIH07XG5cbiAgICBlbGVtZW50Lm9ud2hlZWwgPSAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc3RhdGUuaW5kZXggPSBNYXRoLm1pbihNYXRoLm1heChzdGF0ZS5pbmRleCAtIDEgKiBNYXRoLnNpZ24oZS5kZWx0YVkpLCAxKSwgc3RhdGUubWF4SW5kZXgpO1xuICAgICAgY29uc29sZS5sb2coc3RhdGUuaW5kZXgpO1xuICAgICAgcmVkcmF3Tm93KCk7XG4gICAgfVxuXG4gICAgc3RhdGUuZHJhd2FibGUucHJldlN2Z0hhc2ggPSAnJztcbiAgICByZWRyYXdOb3coZmFsc2UpO1xuICAgIGV2ZW50cy5iaW5kQm9hcmQoc3RhdGUsIGJvdW5kc1VwZGF0ZWQpO1xuICAgIGlmICghcHJldlVuYmluZCkgc3RhdGUuZG9tLnVuYmluZCA9IGV2ZW50cy5iaW5kRG9jdW1lbnQoc3RhdGUsIGJvdW5kc1VwZGF0ZWQpO1xuICAgIHN0YXRlLmV2ZW50cy5pbnNlcnQgJiYgc3RhdGUuZXZlbnRzLmluc2VydChlbGVtZW50cyk7XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgcmV0dXJuIHN0YXJ0KHJlZHJhd0FsbCgpLCByZWRyYXdBbGwpO1xufVxuXG5mdW5jdGlvbiBkZWJvdW5jZVJlZHJhdyhyZWRyYXdOb3c6IChza2lwU3ZnPzogYm9vbGVhbikgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBsZXQgcmVkcmF3aW5nID0gZmFsc2U7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgaWYgKHJlZHJhd2luZykgcmV0dXJuO1xuICAgIHJlZHJhd2luZyA9IHRydWU7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIHJlZHJhd05vdygpO1xuICAgICAgcmVkcmF3aW5nID0gZmFsc2U7XG4gICAgfSk7XG4gIH07XG59XG4iXX0=
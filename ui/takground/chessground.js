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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlc3Nncm91bmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcmMvY2hlc3Nncm91bmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0JBQW1DO0FBQ25DLHFDQUE2QztBQUM3QyxtQ0FBeUQ7QUFFekQsaUNBQW9DO0FBQ3BDLG1DQUFtQztBQUNuQyxxQ0FBZ0Q7QUFDaEQsNkJBQTZCO0FBQzdCLCtCQUErQjtBQUUvQixTQUFnQixXQUFXLENBQUMsT0FBb0IsRUFBRSxNQUFlO0lBQy9ELE1BQU0sVUFBVSxHQUEwQixnQkFBUSxFQUFFLENBQUM7SUFFckQsa0JBQVMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRXBDLFNBQVMsU0FBUztRQUNoQixNQUFNLFVBQVUsR0FBRyxLQUFLLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQzNFLHlEQUF5RDtRQUN6RCxnRUFBZ0U7UUFDaEUsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLFFBQVEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUNsRSxRQUFRLEdBQUcsaUJBQVUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxFQUNwRCxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLENBQUMsRUFDaEUsU0FBUyxHQUFHLENBQUMsT0FBaUIsRUFBUSxFQUFFO1lBQ3RDLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNkLElBQUksQ0FBQyxPQUFPLElBQUksUUFBUSxDQUFDLEdBQUc7Z0JBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25FLENBQUMsRUFDRCxhQUFhLEdBQUcsR0FBUyxFQUFFO1lBQ3pCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNmLHFCQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEIsSUFBSSxRQUFRLENBQUMsR0FBRztnQkFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDO1FBQ0osTUFBTSxLQUFLLEdBQUcsVUFBbUIsQ0FBQztRQUNsQyxLQUFLLENBQUMsR0FBRyxHQUFHO1lBQ1YsUUFBUTtZQUNSLE1BQU07WUFDTixNQUFNLEVBQUUsY0FBYyxDQUFDLFNBQVMsQ0FBQztZQUNqQyxTQUFTO1lBQ1QsTUFBTSxFQUFFLFVBQVU7WUFDbEIsUUFBUTtTQUNULENBQUM7UUFDRixLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDaEMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pCLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxVQUFVO1lBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDOUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsT0FBTyxXQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQXZDRCxrQ0F1Q0M7QUFFRCxTQUFTLGNBQWMsQ0FBQyxTQUFzQztJQUM1RCxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDdEIsT0FBTyxHQUFHLEVBQUU7UUFDVixJQUFJLFNBQVM7WUFBRSxPQUFPO1FBQ3RCLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDakIscUJBQXFCLENBQUMsR0FBRyxFQUFFO1lBQ3pCLFNBQVMsRUFBRSxDQUFDO1lBQ1osU0FBUyxHQUFHLEtBQUssQ0FBQztRQUNwQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcGksIHN0YXJ0IH0gZnJvbSAnLi9hcGknO1xuaW1wb3J0IHsgQ29uZmlnLCBjb25maWd1cmUgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgeyBIZWFkbGVzc1N0YXRlLCBTdGF0ZSwgZGVmYXVsdHMgfSBmcm9tICcuL3N0YXRlJztcblxuaW1wb3J0IHsgcmVuZGVyV3JhcCB9IGZyb20gJy4vd3JhcCc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IHsgcmVuZGVyLCB1cGRhdGVCb3VuZHMgfSBmcm9tICcuL3JlbmRlcic7XG5pbXBvcnQgKiBhcyBzdmcgZnJvbSAnLi9zdmcnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgZnVuY3Rpb24gQ2hlc3Nncm91bmQoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNvbmZpZz86IENvbmZpZyk6IEFwaSB7XG4gIGNvbnN0IG1heWJlU3RhdGU6IFN0YXRlIHwgSGVhZGxlc3NTdGF0ZSA9IGRlZmF1bHRzKCk7XG5cbiAgY29uZmlndXJlKG1heWJlU3RhdGUsIGNvbmZpZyB8fCB7fSk7XG5cbiAgZnVuY3Rpb24gcmVkcmF3QWxsKCk6IFN0YXRlIHtcbiAgICBjb25zdCBwcmV2VW5iaW5kID0gJ2RvbScgaW4gbWF5YmVTdGF0ZSA/IG1heWJlU3RhdGUuZG9tLnVuYmluZCA6IHVuZGVmaW5lZDtcbiAgICAvLyBjb21wdXRlIGJvdW5kcyBmcm9tIGV4aXN0aW5nIGJvYXJkIGVsZW1lbnQgaWYgcG9zc2libGVcbiAgICAvLyB0aGlzIGFsbG93cyBub24tc3F1YXJlIGJvYXJkcyBmcm9tIENTUyB0byBiZSBoYW5kbGVkIChmb3IgM0QpXG4gICAgY29uc3QgcmVsYXRpdmUgPSBtYXliZVN0YXRlLnZpZXdPbmx5ICYmICFtYXliZVN0YXRlLmRyYXdhYmxlLnZpc2libGUsXG4gICAgICBlbGVtZW50cyA9IHJlbmRlcldyYXAoZWxlbWVudCwgbWF5YmVTdGF0ZSwgcmVsYXRpdmUpLFxuICAgICAgYm91bmRzID0gdXRpbC5tZW1vKCgpID0+IGVsZW1lbnRzLmJvYXJkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKSxcbiAgICAgIHJlZHJhd05vdyA9IChza2lwU3ZnPzogYm9vbGVhbik6IHZvaWQgPT4ge1xuICAgICAgICByZW5kZXIoc3RhdGUpO1xuICAgICAgICBpZiAoIXNraXBTdmcgJiYgZWxlbWVudHMuc3ZnKSBzdmcucmVuZGVyU3ZnKHN0YXRlLCBlbGVtZW50cy5zdmcpO1xuICAgICAgfSxcbiAgICAgIGJvdW5kc1VwZGF0ZWQgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIGJvdW5kcy5jbGVhcigpO1xuICAgICAgICB1cGRhdGVCb3VuZHMoc3RhdGUpO1xuICAgICAgICBpZiAoZWxlbWVudHMuc3ZnKSBzdmcucmVuZGVyU3ZnKHN0YXRlLCBlbGVtZW50cy5zdmcpO1xuICAgICAgfTtcbiAgICBjb25zdCBzdGF0ZSA9IG1heWJlU3RhdGUgYXMgU3RhdGU7XG4gICAgc3RhdGUuZG9tID0ge1xuICAgICAgZWxlbWVudHMsXG4gICAgICBib3VuZHMsXG4gICAgICByZWRyYXc6IGRlYm91bmNlUmVkcmF3KHJlZHJhd05vdyksXG4gICAgICByZWRyYXdOb3csXG4gICAgICB1bmJpbmQ6IHByZXZVbmJpbmQsXG4gICAgICByZWxhdGl2ZSxcbiAgICB9O1xuICAgIHN0YXRlLmRyYXdhYmxlLnByZXZTdmdIYXNoID0gJyc7XG4gICAgcmVkcmF3Tm93KGZhbHNlKTtcbiAgICBldmVudHMuYmluZEJvYXJkKHN0YXRlLCBib3VuZHNVcGRhdGVkKTtcbiAgICBpZiAoIXByZXZVbmJpbmQpIHN0YXRlLmRvbS51bmJpbmQgPSBldmVudHMuYmluZERvY3VtZW50KHN0YXRlLCBib3VuZHNVcGRhdGVkKTtcbiAgICBzdGF0ZS5ldmVudHMuaW5zZXJ0ICYmIHN0YXRlLmV2ZW50cy5pbnNlcnQoZWxlbWVudHMpO1xuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIHJldHVybiBzdGFydChyZWRyYXdBbGwoKSwgcmVkcmF3QWxsKTtcbn1cblxuZnVuY3Rpb24gZGVib3VuY2VSZWRyYXcocmVkcmF3Tm93OiAoc2tpcFN2Zz86IGJvb2xlYW4pID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgbGV0IHJlZHJhd2luZyA9IGZhbHNlO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIGlmIChyZWRyYXdpbmcpIHJldHVybjtcbiAgICByZWRyYXdpbmcgPSB0cnVlO1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICByZWRyYXdOb3coKTtcbiAgICAgIHJlZHJhd2luZyA9IGZhbHNlO1xuICAgIH0pO1xuICB9O1xufVxuIl19
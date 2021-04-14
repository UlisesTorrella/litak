"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whitePov = exports.getSnappedKeyAtDomPos = exports.getKeyAtDomPos = exports.stop = exports.cancelMove = exports.playPredrop = exports.playPremove = exports.isDraggable = exports.canTakMove = exports.canMove = exports.unselect = exports.setSelected = exports.selectSquare = exports.dropNewPiece = exports.userMove = exports.baseNewPiece = exports.baseMove = exports.takMove = exports.unsetPredrop = exports.unsetPremove = exports.setCheck = exports.setPieces = exports.reset = exports.toggleOrientation = exports.callUserFunction = void 0;
const util_1 = require("./util");
const premove_1 = require("./premove");
function callUserFunction(f, ...args) {
    if (f)
        setTimeout(() => f(...args), 1);
}
exports.callUserFunction = callUserFunction;
function toggleOrientation(state) {
    state.orientation = util_1.opposite(state.orientation);
    state.animation.current = state.draggable.current = state.selected = undefined;
}
exports.toggleOrientation = toggleOrientation;
function reset(state) {
    state.lastMove = undefined;
    unselect(state);
    unsetPremove(state);
    unsetPredrop(state);
}
exports.reset = reset;
function setPieces(state, pieces) {
    for (const [key, piece] of pieces) {
        if (piece)
            state.pieces.set(key, piece);
        else
            state.pieces.delete(key);
    }
}
exports.setPieces = setPieces;
function setCheck(state, color) {
    state.check = undefined;
    if (color === true)
        color = state.turnColor;
    if (color)
        for (const [k, p] of state.pieces) {
            if (p.role === 'king' && p.color === color) {
                state.check = k;
            }
        }
}
exports.setCheck = setCheck;
function setPremove(state, orig, dest, meta) {
    unsetPredrop(state);
    state.premovable.current = { index: state.index, orig: orig, dir: util_1.keysToDir(orig, dest), drops: [state.index] };
    callUserFunction(state.premovable.events.set, orig, dest, meta);
}
function unsetPremove(state) {
    if (state.premovable.current) {
        state.premovable.current = undefined;
        callUserFunction(state.premovable.events.unset);
    }
}
exports.unsetPremove = unsetPremove;
function setPredrop(state, role, key) {
    unsetPremove(state);
    state.predroppable.current = { role, key };
    callUserFunction(state.predroppable.events.set, role, key);
}
function unsetPredrop(state) {
    const pd = state.predroppable;
    if (pd.current) {
        pd.current = undefined;
        callUserFunction(pd.events.unset);
    }
}
exports.unsetPredrop = unsetPredrop;
function tryAutoCastle(state, orig, dest) {
    if (!state.autoCastle)
        return false;
    const king = state.pieces.get(orig);
    if (!king || king.role !== 'king')
        return false;
    const origPos = util_1.key2pos(orig);
    const destPos = util_1.key2pos(dest);
    if ((origPos[1] !== 0 && origPos[1] !== 7) || origPos[1] !== destPos[1])
        return false;
    if (origPos[0] === 4 && !state.pieces.has(dest)) {
        if (destPos[0] === 6)
            dest = util_1.pos2key([7, destPos[1]]);
        else if (destPos[0] === 2)
            dest = util_1.pos2key([0, destPos[1]]);
    }
    const rook = state.pieces.get(dest);
    if (!rook || rook.color !== king.color || rook.role !== 'rook')
        return false;
    state.pieces.delete(orig);
    state.pieces.delete(dest);
    if (origPos[0] < destPos[0]) {
        state.pieces.set(util_1.pos2key([6, destPos[1]]), king);
        state.pieces.set(util_1.pos2key([5, destPos[1]]), rook);
    }
    else {
        state.pieces.set(util_1.pos2key([2, destPos[1]]), king);
        state.pieces.set(util_1.pos2key([3, destPos[1]]), rook);
    }
    return true;
}
function takMove(state, move) {
    let res = false;
    move.drops.forEach((drop) => {
        let dest = util_1.moveTo(move.orig, move.dir);
        if (dest && move.index > 0) {
            res = baseMove(state, move.orig, dest, move.index) && res;
            move.index -= drop;
            move.orig = dest;
        }
    });
    return res;
}
exports.takMove = takMove;
/*
Test move:
origPiece = {bellow: [{color: "Black"}], color: "White"}
destPiece = {color: "Black"}
state = {pieces: new Map()}
state.pieces.set("a1", origPiece)
state.pieces.set("a2", destPiece)
orig = "a1"
dest = "a2"
index = 0
*/
function baseMove(state, orig, dest, index = 1) {
    var _a, _b;
    const origPiece = state.pieces.get(orig), destPiece = state.pieces.get(dest);
    index = index - 1; // to correct for index;
    if (orig === dest || !origPiece)
        return false;
    const captured = destPiece;
    if (dest === state.selected)
        unselect(state);
    callUserFunction(state.events.move, orig, dest, captured);
    if (!tryAutoCastle(state, orig, dest)) {
        if (origPiece.bellow && origPiece.bellow.length - index > 0) {
            let leftPieces = origPiece.bellow.splice(index, origPiece.bellow.length);
            let newTop = leftPieces.shift();
            newTop.bellow = leftPieces; // affects the piece that will be place on dest
            state.pieces.set(orig, newTop);
        }
        else {
            state.pieces.delete(orig);
        }
        if (destPiece) {
            let piece = origPiece;
            destPiece.role = 'flatstone'; // nothing but a flatstone can be stepped on
            piece.bellow = ((_a = piece.bellow) !== null && _a !== void 0 ? _a : []).concat([destPiece].concat((_b = destPiece.bellow) !== null && _b !== void 0 ? _b : []));
            state.pieces.set(dest, piece);
        }
        else {
            state.pieces.set(dest, origPiece);
        }
        //state.pieces.delete(orig); TODO: if orig stack is empty delete
    }
    state.lastMove = [orig, dest];
    state.check = undefined;
    callUserFunction(state.events.change);
    return true;
}
exports.baseMove = baseMove;
function baseNewPiece(state, piece, key, force) {
    if (state.pieces.has(key)) {
        if (force)
            state.pieces.delete(key);
        else
            return false;
    }
    callUserFunction(state.events.dropNewPiece, piece, key);
    state.pieces.set(key, piece);
    state.lastMove = [key];
    state.check = undefined;
    callUserFunction(state.events.change);
    state.movable.dests = undefined;
    state.turnColor = util_1.opposite(state.turnColor);
    return true;
}
exports.baseNewPiece = baseNewPiece;
function baseUserMove(state, orig, dest) {
    const result = baseMove(state, orig, dest, state.currIndex);
    return result;
}
function userMove(state, orig, dest) {
    var _a;
    if (canMove(state, orig, dest)) {
        const result = baseUserMove(state, orig, dest);
        if (result) {
            const holdTime = state.hold.stop();
            unselect(state);
            const metadata = {
                premove: false,
                ctrlKey: state.stats.ctrlKey,
                holdTime,
            };
            if (state.currIndex === state.index) {
                if (result) {
                    state.movable.dests = undefined;
                    state.turnColor = util_1.opposite(state.turnColor);
                    state.animation.current = undefined;
                }
                const move = state.buildingMove
                    ? Object.assign(Object.assign({}, state.buildingMove), { drops: [...state.buildingMove.drops, state.index] }) : { index: state.currIndex, orig: orig, dir: util_1.keysToDir(orig, dest), drops: [state.index] };
                state.currIndex = 10; // turn off
                state.buildingMove = undefined;
                if (result !== true)
                    metadata.captured = result;
                callUserFunction(state.movable.events.after, move, metadata);
            }
            else {
                if (state.buildingMove) {
                    state.buildingMove = Object.assign(Object.assign({}, state.buildingMove), { drops: [...state.buildingMove.drops, state.currIndex - state.index] });
                    state.currIndex = state.currIndex - state.index;
                }
                else {
                    state.buildingMove = { index: state.currIndex, orig: orig, dir: util_1.keysToDir(orig, dest), drops: [state.currIndex - state.index] };
                    setSelected(state, dest);
                }
                if (util_1.moveTo(dest, util_1.keysToDir(orig, dest))) {
                    (_a = state.movable.dests) === null || _a === void 0 ? void 0 : _a.set(dest, [util_1.moveTo(dest, util_1.keysToDir(orig, dest))]);
                }
            }
            return true;
        }
    }
    else if (canPremove(state, orig, dest)) {
        setPremove(state, orig, dest, {
            ctrlKey: state.stats.ctrlKey,
        });
        unselect(state);
        return true;
    }
    unselect(state);
    return false;
}
exports.userMove = userMove;
function dropNewPiece(state, orig, dest, force) {
    const piece = state.pieces.get(orig);
    if (piece && (canDrop(state, orig, dest) || force)) {
        state.pieces.delete(orig);
        baseNewPiece(state, piece, dest, force);
        callUserFunction(state.movable.events.afterNewPiece, piece.role, dest, {
            premove: false,
            predrop: false,
        });
    }
    else if (piece && canPredrop(state, orig, dest)) {
        setPredrop(state, piece.role, dest);
    }
    else {
        unsetPremove(state);
        unsetPredrop(state);
    }
    state.pieces.delete(orig);
    unselect(state);
}
exports.dropNewPiece = dropNewPiece;
function selectSquare(state, key, force) {
    callUserFunction(state.events.select, key);
    if (state.selected) {
        if (state.selected === key && !state.draggable.enabled) {
            unselect(state);
            state.hold.cancel();
            return;
        }
        else if ((state.selectable.enabled || force) && state.selected !== key) {
            if (userMove(state, state.selected, key)) {
                state.stats.dragged = false;
                return;
            }
        }
    }
    if (isMovable(state, key) || isPremovable(state, key)) {
        setSelected(state, key);
        state.hold.start();
    }
    else {
        state.currIndex = 10; // turn off
    }
}
exports.selectSquare = selectSquare;
function setSelected(state, key) {
    state.selected = key;
    const piece = state.pieces.get(key);
    if (piece && piece.bellow) {
        state.index = Math.min(state.index, piece.bellow.length + 1);
    }
    else {
        state.index = 1;
    }
    state.currIndex = state.index;
    if (isPremovable(state, key)) {
        state.premovable.dests = premove_1.premove(state.pieces, key, state.premovable.castle);
    }
    else
        state.premovable.dests = undefined;
}
exports.setSelected = setSelected;
function unselect(state) {
    state.selected = undefined;
    state.premovable.dests = undefined;
    state.hold.cancel();
}
exports.unselect = unselect;
function isMovable(state, orig) {
    const piece = state.pieces.get(orig);
    return (!!piece &&
        (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color)));
}
function canMove(state, orig, dest) {
    var _a, _b, _c, _d, _e;
    if (state.pieces.get(dest) &&
        state.pieces.get(dest).role == "wallstone") {
        return orig !== dest && isMovable(state, orig) && (state.movable.free || !!((_b = (_a = state.movable.dests) === null || _a === void 0 ? void 0 : _a.get(orig)) === null || _b === void 0 ? void 0 : _b.includes(dest)))
            && ((_c = state.pieces.get(orig)) === null || _c === void 0 ? void 0 : _c.role) == "capstone" && state.currIndex == 1;
    }
    else {
        return (orig !== dest && isMovable(state, orig) && (state.movable.free || !!((_e = (_d = state.movable.dests) === null || _d === void 0 ? void 0 : _d.get(orig)) === null || _e === void 0 ? void 0 : _e.includes(dest))));
    }
}
exports.canMove = canMove;
function canTakMove(state, move) {
    const dest = util_1.moveTo(move.orig, move.dir);
    return dest ? canMove(state, move.orig, dest) : false;
}
exports.canTakMove = canTakMove;
function canDrop(state, orig, dest) {
    const piece = state.pieces.get(orig);
    return (!!piece &&
        (orig === dest || !state.pieces.has(dest)) &&
        (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color)));
}
function isPremovable(state, orig) {
    const piece = state.pieces.get(orig);
    return !!piece && state.premovable.enabled && state.movable.color === piece.color && state.turnColor !== piece.color;
}
function canPremove(state, orig, dest) {
    return (orig !== dest && isPremovable(state, orig) && premove_1.premove(state.pieces, orig, state.premovable.castle).includes(dest));
}
function canPredrop(state, orig, dest) {
    const piece = state.pieces.get(orig);
    const destPiece = state.pieces.get(dest);
    return (!!piece &&
        (!destPiece || destPiece.color !== state.movable.color) &&
        state.predroppable.enabled &&
        (piece.role !== 'pawn' || (dest[1] !== '1' && dest[1] !== '8')) &&
        state.movable.color === piece.color &&
        state.turnColor !== piece.color);
}
function isDraggable(state, orig) {
    const piece = state.pieces.get(orig);
    return (!!piece &&
        state.draggable.enabled &&
        (state.movable.color === 'both' ||
            (state.movable.color === piece.color && (state.turnColor === piece.color || state.premovable.enabled))));
}
exports.isDraggable = isDraggable;
function playPremove(state) {
    const move = state.premovable.current;
    if (!move)
        return false;
    let success = false;
    if (canTakMove(state, move)) {
        const result = baseUserMove(state, move.orig, util_1.moveTo(move.orig, move.dir));
        if (result) {
            const metadata = { premove: true };
            if (result !== true)
                metadata.captured = result;
            callUserFunction(state.movable.events.after, move, metadata);
            success = true;
        }
    }
    unsetPremove(state);
    return success;
}
exports.playPremove = playPremove;
function playPredrop(state, validate) {
    const drop = state.predroppable.current;
    let success = false;
    if (!drop)
        return false;
    if (validate(drop)) {
        const piece = {
            role: drop.role,
            color: state.movable.color,
        };
        if (baseNewPiece(state, piece, drop.key)) {
            callUserFunction(state.movable.events.afterNewPiece, drop.role, drop.key, {
                premove: false,
                predrop: true,
            });
            success = true;
        }
    }
    unsetPredrop(state);
    return success;
}
exports.playPredrop = playPredrop;
function cancelMove(state) {
    unsetPremove(state);
    unsetPredrop(state);
    unselect(state);
}
exports.cancelMove = cancelMove;
function stop(state) {
    state.movable.color = state.movable.dests = state.animation.current = undefined;
    cancelMove(state);
}
exports.stop = stop;
function getKeyAtDomPos(pos, asWhite, bounds) {
    let file = Math.floor((8 * (pos[0] - bounds.left)) / bounds.width);
    if (!asWhite)
        file = 7 - file;
    let rank = 7 - Math.floor((8 * (pos[1] - bounds.top)) / bounds.height);
    if (!asWhite)
        rank = 7 - rank;
    return file >= 0 && file < 8 && rank >= 0 && rank < 8 ? util_1.pos2key([file, rank]) : undefined;
}
exports.getKeyAtDomPos = getKeyAtDomPos;
function getSnappedKeyAtDomPos(orig, pos, asWhite, bounds) {
    const origPos = util_1.key2pos(orig);
    const validSnapPos = util_1.allPos.filter(pos2 => {
        return premove_1.queen(origPos[0], origPos[1], pos2[0], pos2[1]) || premove_1.knight(origPos[0], origPos[1], pos2[0], pos2[1]);
    });
    const validSnapCenters = validSnapPos.map(pos2 => util_1.computeSquareCenter(util_1.pos2key(pos2), asWhite, bounds));
    const validSnapDistances = validSnapCenters.map(pos2 => util_1.distanceSq(pos, pos2));
    const [, closestSnapIndex] = validSnapDistances.reduce((a, b, index) => (a[0] < b ? a : [b, index]), [
        validSnapDistances[0],
        0,
    ]);
    return util_1.pos2key(validSnapPos[closestSnapIndex]);
}
exports.getSnappedKeyAtDomPos = getSnappedKeyAtDomPos;
function whitePov(s) {
    return s.orientation === 'white';
}
exports.whitePov = whitePov;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9hcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcmMvYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsaUNBQWdIO0FBQ2hILHVDQUFtRDtBQUduRCxTQUFnQixnQkFBZ0IsQ0FBcUMsQ0FBZ0IsRUFBRSxHQUFHLElBQW1CO0lBQzNHLElBQUksQ0FBQztRQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRkQsNENBRUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxLQUFvQjtJQUNwRCxLQUFLLENBQUMsV0FBVyxHQUFHLGVBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDaEQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7QUFDakYsQ0FBQztBQUhELDhDQUdDO0FBRUQsU0FBZ0IsS0FBSyxDQUFDLEtBQW9CO0lBQ3hDLEtBQUssQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO0lBQzNCLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoQixZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEIsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3RCLENBQUM7QUFMRCxzQkFLQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxLQUFvQixFQUFFLE1BQXFCO0lBQ25FLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLEVBQUU7UUFDakMsSUFBSSxLQUFLO1lBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDOztZQUNuQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUMvQjtB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QUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQywwQkFBbUIsQ0FBQyxjQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDdkcsTUFBTSxrQkFBa0IsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9FLE1BQU0sQ0FBQyxFQUFFLGdCQUFnQixDQUFDLEdBQUcsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ25HLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUNyQixDQUFDO0tBQ0YsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxjQUFPLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBakJELHNEQWlCQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxDQUFnQjtJQUN2QyxPQUFPLENBQUMsQ0FBQyxXQUFXLEtBQUssT0FBTyxDQUFDO0FBQ25DLENBQUM7QUFGRCw0QkFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEhlYWRsZXNzU3RhdGUgfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7IHBvczJrZXksIGtleTJwb3MsIG9wcG9zaXRlLCBkaXN0YW5jZVNxLCBhbGxQb3MsIGNvbXB1dGVTcXVhcmVDZW50ZXIsIG1vdmVUbywga2V5c1RvRGlyIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7IHByZW1vdmUsIHF1ZWVuLCBrbmlnaHQgfSBmcm9tICcuL3ByZW1vdmUnO1xuaW1wb3J0ICogYXMgY2cgZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxsVXNlckZ1bmN0aW9uPFQgZXh0ZW5kcyAoLi4uYXJnczogYW55W10pID0+IHZvaWQ+KGY6IFQgfCB1bmRlZmluZWQsIC4uLmFyZ3M6IFBhcmFtZXRlcnM8VD4pOiB2b2lkIHtcbiAgaWYgKGYpIHNldFRpbWVvdXQoKCkgPT4gZiguLi5hcmdzKSwgMSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGVPcmllbnRhdGlvbihzdGF0ZTogSGVhZGxlc3NTdGF0ZSk6IHZvaWQge1xuICBzdGF0ZS5vcmllbnRhdGlvbiA9IG9wcG9zaXRlKHN0YXRlLm9yaWVudGF0aW9uKTtcbiAgc3RhdGUuYW5pbWF0aW9uLmN1cnJlbnQgPSBzdGF0ZS5kcmFnZ2FibGUuY3VycmVudCA9IHN0YXRlLnNlbGVjdGVkID0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXQoc3RhdGU6IEhlYWRsZXNzU3RhdGUpOiB2b2lkIHtcbiAgc3RhdGUubGFzdE1vdmUgPSB1bmRlZmluZWQ7XG4gIHVuc2VsZWN0KHN0YXRlKTtcbiAgdW5zZXRQcmVtb3ZlKHN0YXRlKTtcbiAgdW5zZXRQcmVkcm9wKHN0YXRlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFBpZWNlcyhzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgcGllY2VzOiBjZy5QaWVjZXNEaWZmKTogdm9pZCB7XG4gIGZvciAoY29uc3QgW2tleSwgcGllY2VdIG9mIHBpZWNlcykge1xuICAgIGlmIChwaWVjZSkgc3RhdGUucGllY2VzLnNldChrZXksIHBpZWNlKTtcbiAgICBlbHNlIHN0YXRlLnBpZWNlcy5kZWxldGUoa2V5KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2hlY2soc3RhdGU6IEhlYWRsZXNzU3RhdGUsIGNvbG9yOiBjZy5Db2xvciB8IGJvb2xlYW4pOiB2b2lkIHtcbiAgc3RhdGUuY2hlY2sgPSB1bmRlZmluZWQ7XG4gIGlmIChjb2xvciA9PT0gdHJ1ZSkgY29sb3IgPSBzdGF0ZS50dXJuQ29sb3I7XG4gIGlmIChjb2xvcilcbiAgICBmb3IgKGNvbnN0IFtrLCBwXSBvZiBzdGF0ZS5waWVjZXMpIHtcbiAgICAgIGlmIChwLnJvbGUgPT09ICdraW5nJyAmJiBwLmNvbG9yID09PSBjb2xvcikge1xuICAgICAgICBzdGF0ZS5jaGVjayA9IGs7XG4gICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRQcmVtb3ZlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBvcmlnOiBjZy5LZXksIGRlc3Q6IGNnLktleSwgbWV0YTogY2cuU2V0UHJlbW92ZU1ldGFkYXRhKTogdm9pZCB7XG4gIHVuc2V0UHJlZHJvcChzdGF0ZSk7XG4gIHN0YXRlLnByZW1vdmFibGUuY3VycmVudCA9IHtpbmRleDogc3RhdGUuaW5kZXgsIG9yaWc6IG9yaWcsIGRpcjoga2V5c1RvRGlyKG9yaWcsIGRlc3QpLCBkcm9wczogW3N0YXRlLmluZGV4XX0gYXMgY2cuTW92ZTtcbiAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5wcmVtb3ZhYmxlLmV2ZW50cy5zZXQsIG9yaWcsIGRlc3QsIG1ldGEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5zZXRQcmVtb3ZlKHN0YXRlOiBIZWFkbGVzc1N0YXRlKTogdm9pZCB7XG4gIGlmIChzdGF0ZS5wcmVtb3ZhYmxlLmN1cnJlbnQpIHtcbiAgICBzdGF0ZS5wcmVtb3ZhYmxlLmN1cnJlbnQgPSB1bmRlZmluZWQ7XG4gICAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5wcmVtb3ZhYmxlLmV2ZW50cy51bnNldCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0UHJlZHJvcChzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgcm9sZTogY2cuUm9sZSwga2V5OiBjZy5LZXkpOiB2b2lkIHtcbiAgdW5zZXRQcmVtb3ZlKHN0YXRlKTtcbiAgc3RhdGUucHJlZHJvcHBhYmxlLmN1cnJlbnQgPSB7IHJvbGUsIGtleSB9O1xuICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLnByZWRyb3BwYWJsZS5ldmVudHMuc2V0LCByb2xlLCBrZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5zZXRQcmVkcm9wKHN0YXRlOiBIZWFkbGVzc1N0YXRlKTogdm9pZCB7XG4gIGNvbnN0IHBkID0gc3RhdGUucHJlZHJvcHBhYmxlO1xuICBpZiAocGQuY3VycmVudCkge1xuICAgIHBkLmN1cnJlbnQgPSB1bmRlZmluZWQ7XG4gICAgY2FsbFVzZXJGdW5jdGlvbihwZC5ldmVudHMudW5zZXQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyeUF1dG9DYXN0bGUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG9yaWc6IGNnLktleSwgZGVzdDogY2cuS2V5KTogYm9vbGVhbiB7XG4gIGlmICghc3RhdGUuYXV0b0Nhc3RsZSkgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IGtpbmcgPSBzdGF0ZS5waWVjZXMuZ2V0KG9yaWcpO1xuICBpZiAoIWtpbmcgfHwga2luZy5yb2xlICE9PSAna2luZycpIHJldHVybiBmYWxzZTtcblxuICBjb25zdCBvcmlnUG9zID0ga2V5MnBvcyhvcmlnKTtcbiAgY29uc3QgZGVzdFBvcyA9IGtleTJwb3MoZGVzdCk7XG4gIGlmICgob3JpZ1Bvc1sxXSAhPT0gMCAmJiBvcmlnUG9zWzFdICE9PSA3KSB8fCBvcmlnUG9zWzFdICE9PSBkZXN0UG9zWzFdKSByZXR1cm4gZmFsc2U7XG4gIGlmIChvcmlnUG9zWzBdID09PSA0ICYmICFzdGF0ZS5waWVjZXMuaGFzKGRlc3QpKSB7XG4gICAgaWYgKGRlc3RQb3NbMF0gPT09IDYpIGRlc3QgPSBwb3Mya2V5KFs3LCBkZXN0UG9zWzFdXSk7XG4gICAgZWxzZSBpZiAoZGVzdFBvc1swXSA9PT0gMikgZGVzdCA9IHBvczJrZXkoWzAsIGRlc3RQb3NbMV1dKTtcbiAgfVxuICBjb25zdCByb29rID0gc3RhdGUucGllY2VzLmdldChkZXN0KTtcbiAgaWYgKCFyb29rIHx8IHJvb2suY29sb3IgIT09IGtpbmcuY29sb3IgfHwgcm9vay5yb2xlICE9PSAncm9vaycpIHJldHVybiBmYWxzZTtcblxuICBzdGF0ZS5waWVjZXMuZGVsZXRlKG9yaWcpO1xuICBzdGF0ZS5waWVjZXMuZGVsZXRlKGRlc3QpO1xuXG4gIGlmIChvcmlnUG9zWzBdIDwgZGVzdFBvc1swXSkge1xuICAgIHN0YXRlLnBpZWNlcy5zZXQocG9zMmtleShbNiwgZGVzdFBvc1sxXV0pLCBraW5nKTtcbiAgICBzdGF0ZS5waWVjZXMuc2V0KHBvczJrZXkoWzUsIGRlc3RQb3NbMV1dKSwgcm9vayk7XG4gIH0gZWxzZSB7XG4gICAgc3RhdGUucGllY2VzLnNldChwb3Mya2V5KFsyLCBkZXN0UG9zWzFdXSksIGtpbmcpO1xuICAgIHN0YXRlLnBpZWNlcy5zZXQocG9zMmtleShbMywgZGVzdFBvc1sxXV0pLCByb29rKTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRha01vdmUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG1vdmU6IGNnLk1vdmUpOiBib29sZWFuIHtcbiAgbGV0IHJlcyA9IGZhbHNlO1xuICBtb3ZlLmRyb3BzLmZvckVhY2goIChkcm9wKSA9PiB7XG4gICAgbGV0IGRlc3QgPSBtb3ZlVG8obW92ZS5vcmlnLCBtb3ZlLmRpcik7XG4gICAgaWYgKGRlc3QgJiYgbW92ZS5pbmRleCA+IDApIHtcbiAgICAgIHJlcyA9IGJhc2VNb3ZlKHN0YXRlLCBtb3ZlLm9yaWcsIGRlc3QsIG1vdmUuaW5kZXgpICYmIHJlcztcbiAgICAgIG1vdmUuaW5kZXggLT0gZHJvcDtcbiAgICAgIG1vdmUub3JpZyA9IGRlc3Q7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuLypcblRlc3QgbW92ZTpcbm9yaWdQaWVjZSA9IHtiZWxsb3c6IFt7Y29sb3I6IFwiQmxhY2tcIn1dLCBjb2xvcjogXCJXaGl0ZVwifVxuZGVzdFBpZWNlID0ge2NvbG9yOiBcIkJsYWNrXCJ9XG5zdGF0ZSA9IHtwaWVjZXM6IG5ldyBNYXAoKX1cbnN0YXRlLnBpZWNlcy5zZXQoXCJhMVwiLCBvcmlnUGllY2UpXG5zdGF0ZS5waWVjZXMuc2V0KFwiYTJcIiwgZGVzdFBpZWNlKVxub3JpZyA9IFwiYTFcIlxuZGVzdCA9IFwiYTJcIlxuaW5kZXggPSAwXG4qL1xuXG5leHBvcnQgZnVuY3Rpb24gYmFzZU1vdmUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG9yaWc6IGNnLktleSwgZGVzdDogY2cuS2V5LCBpbmRleDogbnVtYmVyID0gMSk6IGJvb2xlYW4ge1xuICBjb25zdCBvcmlnUGllY2UgPSBzdGF0ZS5waWVjZXMuZ2V0KG9yaWcpLFxuICAgIGRlc3RQaWVjZSA9IHN0YXRlLnBpZWNlcy5nZXQoZGVzdCk7XG4gIGluZGV4ID0gaW5kZXggLSAxOyAvLyB0byBjb3JyZWN0IGZvciBpbmRleDtcbiAgaWYgKG9yaWcgPT09IGRlc3QgfHwgIW9yaWdQaWVjZSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBjYXB0dXJlZCA9IGRlc3RQaWVjZTtcbiAgaWYgKGRlc3QgPT09IHN0YXRlLnNlbGVjdGVkKSB1bnNlbGVjdChzdGF0ZSk7XG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUuZXZlbnRzLm1vdmUsIG9yaWcsIGRlc3QsIGNhcHR1cmVkKTtcbiAgaWYgKCF0cnlBdXRvQ2FzdGxlKHN0YXRlLCBvcmlnLCBkZXN0KSkge1xuICAgIGlmIChvcmlnUGllY2UuYmVsbG93ICYmIG9yaWdQaWVjZS5iZWxsb3cubGVuZ3RoLWluZGV4ID4gMCkge1xuICAgICAgbGV0IGxlZnRQaWVjZXMgPSBvcmlnUGllY2UuYmVsbG93LnNwbGljZShpbmRleCwgb3JpZ1BpZWNlLmJlbGxvdy5sZW5ndGgpXG4gICAgICBsZXQgbmV3VG9wID0gbGVmdFBpZWNlcy5zaGlmdCgpITtcbiAgICAgIG5ld1RvcC5iZWxsb3cgPSBsZWZ0UGllY2VzOyAvLyBhZmZlY3RzIHRoZSBwaWVjZSB0aGF0IHdpbGwgYmUgcGxhY2Ugb24gZGVzdFxuICAgICAgc3RhdGUucGllY2VzLnNldChvcmlnLCBuZXdUb3ApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHN0YXRlLnBpZWNlcy5kZWxldGUob3JpZyk7XG4gICAgfVxuICAgIGlmIChkZXN0UGllY2UpIHtcbiAgICAgIGxldCBwaWVjZSA9IG9yaWdQaWVjZTtcbiAgICAgIGRlc3RQaWVjZS5yb2xlID0gJ2ZsYXRzdG9uZScgYXMgY2cuUm9sZTsgLy8gbm90aGluZyBidXQgYSBmbGF0c3RvbmUgY2FuIGJlIHN0ZXBwZWQgb25cbiAgICAgIHBpZWNlLmJlbGxvdyA9IChwaWVjZS5iZWxsb3cgPz8gW10pLmNvbmNhdChbZGVzdFBpZWNlXS5jb25jYXQoZGVzdFBpZWNlLmJlbGxvdyA/PyBbXSkpXG4gICAgICBzdGF0ZS5waWVjZXMuc2V0KGRlc3QsIHBpZWNlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBzdGF0ZS5waWVjZXMuc2V0KGRlc3QsIG9yaWdQaWVjZSk7XG4gICAgfVxuICAgIC8vc3RhdGUucGllY2VzLmRlbGV0ZShvcmlnKTsgVE9ETzogaWYgb3JpZyBzdGFjayBpcyBlbXB0eSBkZWxldGVcbiAgfVxuICBzdGF0ZS5sYXN0TW92ZSA9IFtvcmlnLCBkZXN0XTtcbiAgc3RhdGUuY2hlY2sgPSB1bmRlZmluZWQ7XG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUuZXZlbnRzLmNoYW5nZSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmFzZU5ld1BpZWNlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBwaWVjZTogY2cuUGllY2UsIGtleTogY2cuS2V5LCBmb3JjZT86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgaWYgKHN0YXRlLnBpZWNlcy5oYXMoa2V5KSkge1xuICAgIGlmIChmb3JjZSkgc3RhdGUucGllY2VzLmRlbGV0ZShrZXkpO1xuICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUuZXZlbnRzLmRyb3BOZXdQaWVjZSwgcGllY2UsIGtleSk7XG4gIHN0YXRlLnBpZWNlcy5zZXQoa2V5LCBwaWVjZSk7XG4gIHN0YXRlLmxhc3RNb3ZlID0gW2tleV07XG4gIHN0YXRlLmNoZWNrID0gdW5kZWZpbmVkO1xuICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLmV2ZW50cy5jaGFuZ2UpO1xuICBzdGF0ZS5tb3ZhYmxlLmRlc3RzID0gdW5kZWZpbmVkO1xuICBzdGF0ZS50dXJuQ29sb3IgPSBvcHBvc2l0ZShzdGF0ZS50dXJuQ29sb3IpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gYmFzZVVzZXJNb3ZlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBvcmlnOiBjZy5LZXksIGRlc3Q6IGNnLktleSk6IGNnLlBpZWNlIHwgYm9vbGVhbiB7XG4gIGNvbnN0IHJlc3VsdCA9IGJhc2VNb3ZlKHN0YXRlLCBvcmlnLCBkZXN0LCBzdGF0ZS5jdXJySW5kZXgpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlck1vdmUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG9yaWc6IGNnLktleSwgZGVzdDogY2cuS2V5KTogYm9vbGVhbiB7XG4gIGlmIChjYW5Nb3ZlKHN0YXRlLCBvcmlnLCBkZXN0KSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGJhc2VVc2VyTW92ZShzdGF0ZSwgb3JpZywgZGVzdCk7XG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgY29uc3QgaG9sZFRpbWUgPSBzdGF0ZS5ob2xkLnN0b3AoKTtcbiAgICAgIHVuc2VsZWN0KHN0YXRlKTtcbiAgICAgIGNvbnN0IG1ldGFkYXRhOiBjZy5Nb3ZlTWV0YWRhdGEgPSB7XG4gICAgICAgIHByZW1vdmU6IGZhbHNlLFxuICAgICAgICBjdHJsS2V5OiBzdGF0ZS5zdGF0cy5jdHJsS2V5LFxuICAgICAgICBob2xkVGltZSxcbiAgICAgIH07XG4gICAgICBpZiAoc3RhdGUuY3VyckluZGV4ID09PSBzdGF0ZS5pbmRleCkge1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgc3RhdGUubW92YWJsZS5kZXN0cyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBzdGF0ZS50dXJuQ29sb3IgPSBvcHBvc2l0ZShzdGF0ZS50dXJuQ29sb3IpO1xuICAgICAgICAgIHN0YXRlLmFuaW1hdGlvbi5jdXJyZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1vdmUgPSBzdGF0ZS5idWlsZGluZ01vdmVcbiAgICAgICAgICA/IHsuLi5zdGF0ZS5idWlsZGluZ01vdmUsIGRyb3BzOiBbLi4uc3RhdGUuYnVpbGRpbmdNb3ZlLmRyb3BzLCBzdGF0ZS5pbmRleF19XG4gICAgICAgICAgOiB7aW5kZXg6IHN0YXRlLmN1cnJJbmRleCwgb3JpZzogb3JpZywgZGlyOiBrZXlzVG9EaXIob3JpZywgZGVzdCksIGRyb3BzOiBbc3RhdGUuaW5kZXhdfSBhcyBjZy5Nb3ZlO1xuICAgICAgICBzdGF0ZS5jdXJySW5kZXggPSAxMDsgLy8gdHVybiBvZmZcbiAgICAgICAgc3RhdGUuYnVpbGRpbmdNb3ZlID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAocmVzdWx0ICE9PSB0cnVlKSBtZXRhZGF0YS5jYXB0dXJlZCA9IHJlc3VsdDtcbiAgICAgICAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5tb3ZhYmxlLmV2ZW50cy5hZnRlciwgbW92ZSwgbWV0YWRhdGEpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGlmIChzdGF0ZS5idWlsZGluZ01vdmUpIHtcbiAgICAgICAgICBzdGF0ZS5idWlsZGluZ01vdmUgPSB7Li4uc3RhdGUuYnVpbGRpbmdNb3ZlLCBkcm9wczogWy4uLnN0YXRlLmJ1aWxkaW5nTW92ZS5kcm9wcywgc3RhdGUuY3VyckluZGV4IC0gc3RhdGUuaW5kZXhdfTtcbiAgICAgICAgICBzdGF0ZS5jdXJySW5kZXggPSBzdGF0ZS5jdXJySW5kZXggLSBzdGF0ZS5pbmRleDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBzdGF0ZS5idWlsZGluZ01vdmUgPSB7aW5kZXg6IHN0YXRlLmN1cnJJbmRleCwgb3JpZzogb3JpZywgZGlyOiBrZXlzVG9EaXIob3JpZywgZGVzdCksIGRyb3BzOiBbc3RhdGUuY3VyckluZGV4IC0gc3RhdGUuaW5kZXhdfSBhcyBjZy5Nb3ZlO1xuICAgICAgICAgIHNldFNlbGVjdGVkKHN0YXRlLCBkZXN0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobW92ZVRvKGRlc3QsIGtleXNUb0RpcihvcmlnLCBkZXN0KSkpIHtcbiAgICAgICAgICBzdGF0ZS5tb3ZhYmxlLmRlc3RzPy5zZXQoZGVzdCwgW21vdmVUbyhkZXN0LCBrZXlzVG9EaXIob3JpZywgZGVzdCkpIV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoY2FuUHJlbW92ZShzdGF0ZSwgb3JpZywgZGVzdCkpIHtcbiAgICBzZXRQcmVtb3ZlKHN0YXRlLCBvcmlnLCBkZXN0LCB7XG4gICAgICBjdHJsS2V5OiBzdGF0ZS5zdGF0cy5jdHJsS2V5LFxuICAgIH0pO1xuICAgIHVuc2VsZWN0KHN0YXRlKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB1bnNlbGVjdChzdGF0ZSk7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRyb3BOZXdQaWVjZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgb3JpZzogY2cuS2V5LCBkZXN0OiBjZy5LZXksIGZvcmNlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBwaWVjZSA9IHN0YXRlLnBpZWNlcy5nZXQob3JpZyk7XG4gIGlmIChwaWVjZSAmJiAoY2FuRHJvcChzdGF0ZSwgb3JpZywgZGVzdCkgfHwgZm9yY2UpKSB7XG4gICAgc3RhdGUucGllY2VzLmRlbGV0ZShvcmlnKTtcbiAgICBiYXNlTmV3UGllY2Uoc3RhdGUsIHBpZWNlLCBkZXN0LCBmb3JjZSk7XG4gICAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5tb3ZhYmxlLmV2ZW50cy5hZnRlck5ld1BpZWNlLCBwaWVjZS5yb2xlLCBkZXN0LCB7XG4gICAgICBwcmVtb3ZlOiBmYWxzZSxcbiAgICAgIHByZWRyb3A6IGZhbHNlLFxuICAgIH0pO1xuICB9IGVsc2UgaWYgKHBpZWNlICYmIGNhblByZWRyb3Aoc3RhdGUsIG9yaWcsIGRlc3QpKSB7XG4gICAgc2V0UHJlZHJvcChzdGF0ZSwgcGllY2Uucm9sZSwgZGVzdCk7XG4gIH0gZWxzZSB7XG4gICAgdW5zZXRQcmVtb3ZlKHN0YXRlKTtcbiAgICB1bnNldFByZWRyb3Aoc3RhdGUpO1xuICB9XG4gIHN0YXRlLnBpZWNlcy5kZWxldGUob3JpZyk7XG4gIHVuc2VsZWN0KHN0YXRlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdFNxdWFyZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwga2V5OiBjZy5LZXksIGZvcmNlPzogYm9vbGVhbik6IHZvaWQge1xuICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLmV2ZW50cy5zZWxlY3QsIGtleSk7XG4gIGlmIChzdGF0ZS5zZWxlY3RlZCkge1xuICAgIGlmIChzdGF0ZS5zZWxlY3RlZCA9PT0ga2V5ICYmICFzdGF0ZS5kcmFnZ2FibGUuZW5hYmxlZCkge1xuICAgICAgdW5zZWxlY3Qoc3RhdGUpO1xuICAgICAgc3RhdGUuaG9sZC5jYW5jZWwoKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKChzdGF0ZS5zZWxlY3RhYmxlLmVuYWJsZWQgfHwgZm9yY2UpICYmIHN0YXRlLnNlbGVjdGVkICE9PSBrZXkpIHtcbiAgICAgIGlmICh1c2VyTW92ZShzdGF0ZSwgc3RhdGUuc2VsZWN0ZWQsIGtleSkpIHtcbiAgICAgICAgc3RhdGUuc3RhdHMuZHJhZ2dlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChpc01vdmFibGUoc3RhdGUsIGtleSkgfHwgaXNQcmVtb3ZhYmxlKHN0YXRlLCBrZXkpKSB7XG4gICAgc2V0U2VsZWN0ZWQoc3RhdGUsIGtleSk7XG4gICAgc3RhdGUuaG9sZC5zdGFydCgpO1xuICB9IGVsc2Uge1xuICAgIHN0YXRlLmN1cnJJbmRleCA9IDEwOyAvLyB0dXJuIG9mZlxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRTZWxlY3RlZChzdGF0ZTogSGVhZGxlc3NTdGF0ZSwga2V5OiBjZy5LZXkpOiB2b2lkIHtcbiAgc3RhdGUuc2VsZWN0ZWQgPSBrZXk7XG4gIGNvbnN0IHBpZWNlID0gc3RhdGUucGllY2VzLmdldChrZXkpO1xuICBpZiAocGllY2UgJiYgcGllY2UhLmJlbGxvdykge1xuICAgIHN0YXRlLmluZGV4ID0gTWF0aC5taW4oc3RhdGUuaW5kZXgsIHBpZWNlLmJlbGxvdyEubGVuZ3RoICsgMSlcbiAgfVxuICBlbHNlIHtcbiAgICBzdGF0ZS5pbmRleCA9IDFcbiAgfVxuICBzdGF0ZS5jdXJySW5kZXggPSBzdGF0ZS5pbmRleDtcbiAgaWYgKGlzUHJlbW92YWJsZShzdGF0ZSwga2V5KSkge1xuICAgIHN0YXRlLnByZW1vdmFibGUuZGVzdHMgPSBwcmVtb3ZlKHN0YXRlLnBpZWNlcywga2V5LCBzdGF0ZS5wcmVtb3ZhYmxlLmNhc3RsZSk7XG4gIH0gZWxzZSBzdGF0ZS5wcmVtb3ZhYmxlLmRlc3RzID0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5zZWxlY3Qoc3RhdGU6IEhlYWRsZXNzU3RhdGUpOiB2b2lkIHtcbiAgc3RhdGUuc2VsZWN0ZWQgPSB1bmRlZmluZWQ7XG4gIHN0YXRlLnByZW1vdmFibGUuZGVzdHMgPSB1bmRlZmluZWQ7XG4gIHN0YXRlLmhvbGQuY2FuY2VsKCk7XG59XG5cbmZ1bmN0aW9uIGlzTW92YWJsZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgb3JpZzogY2cuS2V5KTogYm9vbGVhbiB7XG4gIGNvbnN0IHBpZWNlID0gc3RhdGUucGllY2VzLmdldChvcmlnKTtcbiAgcmV0dXJuIChcbiAgICAhIXBpZWNlICYmXG4gICAgKHN0YXRlLm1vdmFibGUuY29sb3IgPT09ICdib3RoJyB8fCAoc3RhdGUubW92YWJsZS5jb2xvciA9PT0gcGllY2UuY29sb3IgJiYgc3RhdGUudHVybkNvbG9yID09PSBwaWVjZS5jb2xvcikpXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5Nb3ZlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBvcmlnOiBjZy5LZXksIGRlc3Q6IGNnLktleSk6IGJvb2xlYW4ge1xuICBpZiAoc3RhdGUucGllY2VzLmdldChkZXN0KSAmJlxuICAgICAgc3RhdGUucGllY2VzLmdldChkZXN0KSEucm9sZSA9PSBcIndhbGxzdG9uZVwiKSB7XG4gICAgcmV0dXJuIG9yaWcgIT09IGRlc3QgJiYgaXNNb3ZhYmxlKHN0YXRlLCBvcmlnKSAmJiAoc3RhdGUubW92YWJsZS5mcmVlIHx8ICEhc3RhdGUubW92YWJsZS5kZXN0cz8uZ2V0KG9yaWcpPy5pbmNsdWRlcyhkZXN0KSlcbiAgICAgICAgICAgJiYgc3RhdGUucGllY2VzLmdldChvcmlnKT8ucm9sZSA9PSBcImNhcHN0b25lXCIgJiYgc3RhdGUuY3VyckluZGV4ID09IDE7XG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIChcbiAgICAgIG9yaWcgIT09IGRlc3QgJiYgaXNNb3ZhYmxlKHN0YXRlLCBvcmlnKSAmJiAoc3RhdGUubW92YWJsZS5mcmVlIHx8ICEhc3RhdGUubW92YWJsZS5kZXN0cz8uZ2V0KG9yaWcpPy5pbmNsdWRlcyhkZXN0KSlcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5UYWtNb3ZlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBtb3ZlOiBjZy5Nb3ZlKTogYm9vbGVhbiB7XG4gIGNvbnN0IGRlc3QgPSBtb3ZlVG8obW92ZS5vcmlnLCBtb3ZlLmRpcik7XG4gIHJldHVybiBkZXN0ID8gY2FuTW92ZShzdGF0ZSwgbW92ZS5vcmlnLCBkZXN0KSA6IGZhbHNlO1xufVxuXG5cbmZ1bmN0aW9uIGNhbkRyb3Aoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG9yaWc6IGNnLktleSwgZGVzdDogY2cuS2V5KTogYm9vbGVhbiB7XG4gIGNvbnN0IHBpZWNlID0gc3RhdGUucGllY2VzLmdldChvcmlnKTtcbiAgcmV0dXJuIChcbiAgICAhIXBpZWNlICYmXG4gICAgKG9yaWcgPT09IGRlc3QgfHwgIXN0YXRlLnBpZWNlcy5oYXMoZGVzdCkpICYmXG4gICAgKHN0YXRlLm1vdmFibGUuY29sb3IgPT09ICdib3RoJyB8fCAoc3RhdGUubW92YWJsZS5jb2xvciA9PT0gcGllY2UuY29sb3IgJiYgc3RhdGUudHVybkNvbG9yID09PSBwaWVjZS5jb2xvcikpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGlzUHJlbW92YWJsZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgb3JpZzogY2cuS2V5KTogYm9vbGVhbiB7XG4gIGNvbnN0IHBpZWNlID0gc3RhdGUucGllY2VzLmdldChvcmlnKTtcbiAgcmV0dXJuICEhcGllY2UgJiYgc3RhdGUucHJlbW92YWJsZS5lbmFibGVkICYmIHN0YXRlLm1vdmFibGUuY29sb3IgPT09IHBpZWNlLmNvbG9yICYmIHN0YXRlLnR1cm5Db2xvciAhPT0gcGllY2UuY29sb3I7XG59XG5cbmZ1bmN0aW9uIGNhblByZW1vdmUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG9yaWc6IGNnLktleSwgZGVzdDogY2cuS2V5KTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgb3JpZyAhPT0gZGVzdCAmJiBpc1ByZW1vdmFibGUoc3RhdGUsIG9yaWcpICYmIHByZW1vdmUoc3RhdGUucGllY2VzLCBvcmlnLCBzdGF0ZS5wcmVtb3ZhYmxlLmNhc3RsZSkuaW5jbHVkZXMoZGVzdClcbiAgKTtcbn1cblxuZnVuY3Rpb24gY2FuUHJlZHJvcChzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgb3JpZzogY2cuS2V5LCBkZXN0OiBjZy5LZXkpOiBib29sZWFuIHtcbiAgY29uc3QgcGllY2UgPSBzdGF0ZS5waWVjZXMuZ2V0KG9yaWcpO1xuICBjb25zdCBkZXN0UGllY2UgPSBzdGF0ZS5waWVjZXMuZ2V0KGRlc3QpO1xuICByZXR1cm4gKFxuICAgICEhcGllY2UgJiZcbiAgICAoIWRlc3RQaWVjZSB8fCBkZXN0UGllY2UuY29sb3IgIT09IHN0YXRlLm1vdmFibGUuY29sb3IpICYmXG4gICAgc3RhdGUucHJlZHJvcHBhYmxlLmVuYWJsZWQgJiZcbiAgICAocGllY2Uucm9sZSAhPT0gJ3Bhd24nIHx8IChkZXN0WzFdICE9PSAnMScgJiYgZGVzdFsxXSAhPT0gJzgnKSkgJiZcbiAgICBzdGF0ZS5tb3ZhYmxlLmNvbG9yID09PSBwaWVjZS5jb2xvciAmJlxuICAgIHN0YXRlLnR1cm5Db2xvciAhPT0gcGllY2UuY29sb3JcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRHJhZ2dhYmxlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBvcmlnOiBjZy5LZXkpOiBib29sZWFuIHtcbiAgY29uc3QgcGllY2UgPSBzdGF0ZS5waWVjZXMuZ2V0KG9yaWcpO1xuICByZXR1cm4gKFxuICAgICEhcGllY2UgJiZcbiAgICBzdGF0ZS5kcmFnZ2FibGUuZW5hYmxlZCAmJlxuICAgIChzdGF0ZS5tb3ZhYmxlLmNvbG9yID09PSAnYm90aCcgfHxcbiAgICAgIChzdGF0ZS5tb3ZhYmxlLmNvbG9yID09PSBwaWVjZS5jb2xvciAmJiAoc3RhdGUudHVybkNvbG9yID09PSBwaWVjZS5jb2xvciB8fCBzdGF0ZS5wcmVtb3ZhYmxlLmVuYWJsZWQpKSlcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBsYXlQcmVtb3ZlKHN0YXRlOiBIZWFkbGVzc1N0YXRlKTogYm9vbGVhbiB7XG4gIGNvbnN0IG1vdmUgPSBzdGF0ZS5wcmVtb3ZhYmxlLmN1cnJlbnQ7XG4gIGlmICghbW92ZSkgcmV0dXJuIGZhbHNlO1xuICBsZXQgc3VjY2VzcyA9IGZhbHNlO1xuICBpZiAoY2FuVGFrTW92ZShzdGF0ZSwgbW92ZSkpIHtcbiAgICBjb25zdCByZXN1bHQgPSBiYXNlVXNlck1vdmUoc3RhdGUsIG1vdmUub3JpZywgbW92ZVRvKG1vdmUub3JpZywgbW92ZS5kaXIpISk7XG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgY29uc3QgbWV0YWRhdGE6IGNnLk1vdmVNZXRhZGF0YSA9IHsgcHJlbW92ZTogdHJ1ZSB9O1xuICAgICAgaWYgKHJlc3VsdCAhPT0gdHJ1ZSkgbWV0YWRhdGEuY2FwdHVyZWQgPSByZXN1bHQ7XG4gICAgICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLm1vdmFibGUuZXZlbnRzLmFmdGVyLCBtb3ZlLCBtZXRhZGF0YSk7XG4gICAgICBzdWNjZXNzID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgdW5zZXRQcmVtb3ZlKHN0YXRlKTtcbiAgcmV0dXJuIHN1Y2Nlc3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwbGF5UHJlZHJvcChzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgdmFsaWRhdGU6IChkcm9wOiBjZy5Ecm9wKSA9PiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGRyb3AgPSBzdGF0ZS5wcmVkcm9wcGFibGUuY3VycmVudDtcbiAgbGV0IHN1Y2Nlc3MgPSBmYWxzZTtcbiAgaWYgKCFkcm9wKSByZXR1cm4gZmFsc2U7XG4gIGlmICh2YWxpZGF0ZShkcm9wKSkge1xuICAgIGNvbnN0IHBpZWNlID0ge1xuICAgICAgcm9sZTogZHJvcC5yb2xlLFxuICAgICAgY29sb3I6IHN0YXRlLm1vdmFibGUuY29sb3IsXG4gICAgfSBhcyBjZy5QaWVjZTtcbiAgICBpZiAoYmFzZU5ld1BpZWNlKHN0YXRlLCBwaWVjZSwgZHJvcC5rZXkpKSB7XG4gICAgICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLm1vdmFibGUuZXZlbnRzLmFmdGVyTmV3UGllY2UsIGRyb3Aucm9sZSwgZHJvcC5rZXksIHtcbiAgICAgICAgcHJlbW92ZTogZmFsc2UsXG4gICAgICAgIHByZWRyb3A6IHRydWUsXG4gICAgICB9KTtcbiAgICAgIHN1Y2Nlc3MgPSB0cnVlO1xuICAgIH1cbiAgfVxuICB1bnNldFByZWRyb3Aoc3RhdGUpO1xuICByZXR1cm4gc3VjY2Vzcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbmNlbE1vdmUoc3RhdGU6IEhlYWRsZXNzU3RhdGUpOiB2b2lkIHtcbiAgdW5zZXRQcmVtb3ZlKHN0YXRlKTtcbiAgdW5zZXRQcmVkcm9wKHN0YXRlKTtcbiAgdW5zZWxlY3Qoc3RhdGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcChzdGF0ZTogSGVhZGxlc3NTdGF0ZSk6IHZvaWQge1xuICBzdGF0ZS5tb3ZhYmxlLmNvbG9yID0gc3RhdGUubW92YWJsZS5kZXN0cyA9IHN0YXRlLmFuaW1hdGlvbi5jdXJyZW50ID0gdW5kZWZpbmVkO1xuICBjYW5jZWxNb3ZlKHN0YXRlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEtleUF0RG9tUG9zKHBvczogY2cuTnVtYmVyUGFpciwgYXNXaGl0ZTogYm9vbGVhbiwgYm91bmRzOiBDbGllbnRSZWN0KTogY2cuS2V5IHwgdW5kZWZpbmVkIHtcbiAgbGV0IGZpbGUgPSBNYXRoLmZsb29yKCg4ICogKHBvc1swXSAtIGJvdW5kcy5sZWZ0KSkgLyBib3VuZHMud2lkdGgpO1xuICBpZiAoIWFzV2hpdGUpIGZpbGUgPSA3IC0gZmlsZTtcbiAgbGV0IHJhbmsgPSA3IC0gTWF0aC5mbG9vcigoOCAqIChwb3NbMV0gLSBib3VuZHMudG9wKSkgLyBib3VuZHMuaGVpZ2h0KTtcbiAgaWYgKCFhc1doaXRlKSByYW5rID0gNyAtIHJhbms7XG4gIHJldHVybiBmaWxlID49IDAgJiYgZmlsZSA8IDggJiYgcmFuayA+PSAwICYmIHJhbmsgPCA4ID8gcG9zMmtleShbZmlsZSwgcmFua10pIDogdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U25hcHBlZEtleUF0RG9tUG9zKFxuICBvcmlnOiBjZy5LZXksXG4gIHBvczogY2cuTnVtYmVyUGFpcixcbiAgYXNXaGl0ZTogYm9vbGVhbixcbiAgYm91bmRzOiBDbGllbnRSZWN0XG4pOiBjZy5LZXkgfCB1bmRlZmluZWQge1xuICBjb25zdCBvcmlnUG9zID0ga2V5MnBvcyhvcmlnKTtcbiAgY29uc3QgdmFsaWRTbmFwUG9zID0gYWxsUG9zLmZpbHRlcihwb3MyID0+IHtcbiAgICByZXR1cm4gcXVlZW4ob3JpZ1Bvc1swXSwgb3JpZ1Bvc1sxXSwgcG9zMlswXSwgcG9zMlsxXSkgfHwga25pZ2h0KG9yaWdQb3NbMF0sIG9yaWdQb3NbMV0sIHBvczJbMF0sIHBvczJbMV0pO1xuICB9KTtcbiAgY29uc3QgdmFsaWRTbmFwQ2VudGVycyA9IHZhbGlkU25hcFBvcy5tYXAocG9zMiA9PiBjb21wdXRlU3F1YXJlQ2VudGVyKHBvczJrZXkocG9zMiksIGFzV2hpdGUsIGJvdW5kcykpO1xuICBjb25zdCB2YWxpZFNuYXBEaXN0YW5jZXMgPSB2YWxpZFNuYXBDZW50ZXJzLm1hcChwb3MyID0+IGRpc3RhbmNlU3EocG9zLCBwb3MyKSk7XG4gIGNvbnN0IFssIGNsb3Nlc3RTbmFwSW5kZXhdID0gdmFsaWRTbmFwRGlzdGFuY2VzLnJlZHVjZSgoYSwgYiwgaW5kZXgpID0+IChhWzBdIDwgYiA/IGEgOiBbYiwgaW5kZXhdKSwgW1xuICAgIHZhbGlkU25hcERpc3RhbmNlc1swXSxcbiAgICAwLFxuICBdKTtcbiAgcmV0dXJuIHBvczJrZXkodmFsaWRTbmFwUG9zW2Nsb3Nlc3RTbmFwSW5kZXhdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdoaXRlUG92KHM6IEhlYWRsZXNzU3RhdGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIHMub3JpZW50YXRpb24gPT09ICd3aGl0ZSc7XG59XG4iXX0=
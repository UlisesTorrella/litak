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
            piece.bellow = ((_a = piece.bellow) !== null && _a !== void 0 ? _a : []).concat([destPiece].concat((_b = destPiece.bellow) !== null && _b !== void 0 ? _b : []));
            state.pieces.set(dest, piece);
        }
        else {
            state.pieces.set(dest, origPiece);
        }
        //state.pieces.delete(orig); TODO: if orig stack is empty delete
    }
    state.lastMove = [orig, dest];
    if (state.pieces.get(dest) && state.pieces.get(dest).bellow && state.pieces.get(dest).bellow.length + 1 > state.maxIndex) {
        state.maxIndex = state.pieces.get(dest).bellow.length + 1;
    }
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
    var _a, _b;
    return (orig !== dest && isMovable(state, orig) && (state.movable.free || !!((_b = (_a = state.movable.dests) === null || _a === void 0 ? void 0 : _a.get(orig)) === null || _b === void 0 ? void 0 : _b.includes(dest))));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9hcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcmMvYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsaUNBQWdIO0FBQ2hILHVDQUFtRDtBQUduRCxTQUFnQixnQkFBZ0IsQ0FBcUMsQ0FBZ0IsRUFBRSxHQUFHLElBQW1CO0lBQzNHLElBQUksQ0FBQztRQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRkQsNENBRUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxLQUFvQjtJQUNwRCxLQUFLLENBQUMsV0FBVyxHQUFHLGVBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDaEQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7QUFDakYsQ0FBQztBQUhELDhDQUdDO0FBRUQsU0FBZ0IsS0FBSyxDQUFDLEtBQW9CO0lBQ3hDLEtBQUssQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO0lBQzNCLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoQixZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEIsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3RCLENBQUM7QUFMRCxzQkFLQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxLQUFvQixFQUFFLE1BQXFCO0lBQ25FLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLEVBQUU7UUFDakMsSUFBSSxLQUFLO1lBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDOztZQUNuQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUMvQjtB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QUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUM3RyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLEtBQW9CLEVBQUUsSUFBWTtJQUN0RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDdkgsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLEtBQW9CLEVBQUUsSUFBWSxFQUFFLElBQVk7SUFDbEUsT0FBTyxDQUNMLElBQUksS0FBSyxJQUFJLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxpQkFBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUNsSCxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLEtBQW9CLEVBQUUsSUFBWSxFQUFFLElBQVk7SUFDbEUsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekMsT0FBTyxDQUNMLENB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RSxDQUFDLGlCQUFVLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDL0UsTUFBTSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDbkcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLENBQUM7S0FDRixDQUFDLENBQUM7SUFDSCxPQUFPLGNBQU8sQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFqQkQsc0RBaUJDO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLENBQWdCO0lBQ3ZDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsS0FBSyxPQUFPLENBQUM7QUFDbkMsQ0FBQztBQUZELDRCQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSGVhZGxlc3NTdGF0ZSB9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHsgcG9zMmtleSwga2V5MnBvcywgb3Bwb3NpdGUsIGRpc3RhbmNlU3EsIGFsbFBvcywgY29tcHV0ZVNxdWFyZUNlbnRlciwgbW92ZVRvLCBrZXlzVG9EaXIgfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHsgcHJlbW92ZSwgcXVlZW4sIGtuaWdodCB9IGZyb20gJy4vcHJlbW92ZSc7XG5pbXBvcnQgKiBhcyBjZyBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGxVc2VyRnVuY3Rpb248VCBleHRlbmRzICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZD4oZjogVCB8IHVuZGVmaW5lZCwgLi4uYXJnczogUGFyYW1ldGVyczxUPik6IHZvaWQge1xuICBpZiAoZikgc2V0VGltZW91dCgoKSA9PiBmKC4uLmFyZ3MpLCAxKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZU9yaWVudGF0aW9uKHN0YXRlOiBIZWFkbGVzc1N0YXRlKTogdm9pZCB7XG4gIHN0YXRlLm9yaWVudGF0aW9uID0gb3Bwb3NpdGUoc3RhdGUub3JpZW50YXRpb24pO1xuICBzdGF0ZS5hbmltYXRpb24uY3VycmVudCA9IHN0YXRlLmRyYWdnYWJsZS5jdXJyZW50ID0gc3RhdGUuc2VsZWN0ZWQgPSB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldChzdGF0ZTogSGVhZGxlc3NTdGF0ZSk6IHZvaWQge1xuICBzdGF0ZS5sYXN0TW92ZSA9IHVuZGVmaW5lZDtcbiAgdW5zZWxlY3Qoc3RhdGUpO1xuICB1bnNldFByZW1vdmUoc3RhdGUpO1xuICB1bnNldFByZWRyb3Aoc3RhdGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UGllY2VzKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBwaWVjZXM6IGNnLlBpZWNlc0RpZmYpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBba2V5LCBwaWVjZV0gb2YgcGllY2VzKSB7XG4gICAgaWYgKHBpZWNlKSBzdGF0ZS5waWVjZXMuc2V0KGtleSwgcGllY2UpO1xuICAgIGVsc2Ugc3RhdGUucGllY2VzLmRlbGV0ZShrZXkpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDaGVjayhzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgY29sb3I6IGNnLkNvbG9yIHwgYm9vbGVhbik6IHZvaWQge1xuICBzdGF0ZS5jaGVjayA9IHVuZGVmaW5lZDtcbiAgaWYgKGNvbG9yID09PSB0cnVlKSBjb2xvciA9IHN0YXRlLnR1cm5Db2xvcjtcbiAgaWYgKGNvbG9yKVxuICAgIGZvciAoY29uc3QgW2ssIHBdIG9mIHN0YXRlLnBpZWNlcykge1xuICAgICAgaWYgKHAucm9sZSA9PT0gJ2tpbmcnICYmIHAuY29sb3IgPT09IGNvbG9yKSB7XG4gICAgICAgIHN0YXRlLmNoZWNrID0gaztcbiAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldFByZW1vdmUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG9yaWc6IGNnLktleSwgZGVzdDogY2cuS2V5LCBtZXRhOiBjZy5TZXRQcmVtb3ZlTWV0YWRhdGEpOiB2b2lkIHtcbiAgdW5zZXRQcmVkcm9wKHN0YXRlKTtcbiAgc3RhdGUucHJlbW92YWJsZS5jdXJyZW50ID0ge2luZGV4OiBzdGF0ZS5pbmRleCwgb3JpZzogb3JpZywgZGlyOiBrZXlzVG9EaXIob3JpZywgZGVzdCksIGRyb3BzOiBbc3RhdGUuaW5kZXhdfSBhcyBjZy5Nb3ZlO1xuICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLnByZW1vdmFibGUuZXZlbnRzLnNldCwgb3JpZywgZGVzdCwgbWV0YSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bnNldFByZW1vdmUoc3RhdGU6IEhlYWRsZXNzU3RhdGUpOiB2b2lkIHtcbiAgaWYgKHN0YXRlLnByZW1vdmFibGUuY3VycmVudCkge1xuICAgIHN0YXRlLnByZW1vdmFibGUuY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLnByZW1vdmFibGUuZXZlbnRzLnVuc2V0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRQcmVkcm9wKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCByb2xlOiBjZy5Sb2xlLCBrZXk6IGNnLktleSk6IHZvaWQge1xuICB1bnNldFByZW1vdmUoc3RhdGUpO1xuICBzdGF0ZS5wcmVkcm9wcGFibGUuY3VycmVudCA9IHsgcm9sZSwga2V5IH07XG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUucHJlZHJvcHBhYmxlLmV2ZW50cy5zZXQsIHJvbGUsIGtleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bnNldFByZWRyb3Aoc3RhdGU6IEhlYWRsZXNzU3RhdGUpOiB2b2lkIHtcbiAgY29uc3QgcGQgPSBzdGF0ZS5wcmVkcm9wcGFibGU7XG4gIGlmIChwZC5jdXJyZW50KSB7XG4gICAgcGQuY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgICBjYWxsVXNlckZ1bmN0aW9uKHBkLmV2ZW50cy51bnNldCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5QXV0b0Nhc3RsZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgb3JpZzogY2cuS2V5LCBkZXN0OiBjZy5LZXkpOiBib29sZWFuIHtcbiAgaWYgKCFzdGF0ZS5hdXRvQ2FzdGxlKSByZXR1cm4gZmFsc2U7XG5cbiAgY29uc3Qga2luZyA9IHN0YXRlLnBpZWNlcy5nZXQob3JpZyk7XG4gIGlmICgha2luZyB8fCBraW5nLnJvbGUgIT09ICdraW5nJykgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IG9yaWdQb3MgPSBrZXkycG9zKG9yaWcpO1xuICBjb25zdCBkZXN0UG9zID0ga2V5MnBvcyhkZXN0KTtcbiAgaWYgKChvcmlnUG9zWzFdICE9PSAwICYmIG9yaWdQb3NbMV0gIT09IDcpIHx8IG9yaWdQb3NbMV0gIT09IGRlc3RQb3NbMV0pIHJldHVybiBmYWxzZTtcbiAgaWYgKG9yaWdQb3NbMF0gPT09IDQgJiYgIXN0YXRlLnBpZWNlcy5oYXMoZGVzdCkpIHtcbiAgICBpZiAoZGVzdFBvc1swXSA9PT0gNikgZGVzdCA9IHBvczJrZXkoWzcsIGRlc3RQb3NbMV1dKTtcbiAgICBlbHNlIGlmIChkZXN0UG9zWzBdID09PSAyKSBkZXN0ID0gcG9zMmtleShbMCwgZGVzdFBvc1sxXV0pO1xuICB9XG4gIGNvbnN0IHJvb2sgPSBzdGF0ZS5waWVjZXMuZ2V0KGRlc3QpO1xuICBpZiAoIXJvb2sgfHwgcm9vay5jb2xvciAhPT0ga2luZy5jb2xvciB8fCByb29rLnJvbGUgIT09ICdyb29rJykgcmV0dXJuIGZhbHNlO1xuXG4gIHN0YXRlLnBpZWNlcy5kZWxldGUob3JpZyk7XG4gIHN0YXRlLnBpZWNlcy5kZWxldGUoZGVzdCk7XG5cbiAgaWYgKG9yaWdQb3NbMF0gPCBkZXN0UG9zWzBdKSB7XG4gICAgc3RhdGUucGllY2VzLnNldChwb3Mya2V5KFs2LCBkZXN0UG9zWzFdXSksIGtpbmcpO1xuICAgIHN0YXRlLnBpZWNlcy5zZXQocG9zMmtleShbNSwgZGVzdFBvc1sxXV0pLCByb29rKTtcbiAgfSBlbHNlIHtcbiAgICBzdGF0ZS5waWVjZXMuc2V0KHBvczJrZXkoWzIsIGRlc3RQb3NbMV1dKSwga2luZyk7XG4gICAgc3RhdGUucGllY2VzLnNldChwb3Mya2V5KFszLCBkZXN0UG9zWzFdXSksIHJvb2spO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGFrTW92ZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgbW92ZTogY2cuTW92ZSk6IGJvb2xlYW4ge1xuICBsZXQgcmVzID0gZmFsc2U7XG4gIG1vdmUuZHJvcHMuZm9yRWFjaCggKGRyb3ApID0+IHtcbiAgICBsZXQgZGVzdCA9IG1vdmVUbyhtb3ZlLm9yaWcsIG1vdmUuZGlyKTtcbiAgICBpZiAoZGVzdCAmJiBtb3ZlLmluZGV4ID4gMCkge1xuICAgICAgcmVzID0gYmFzZU1vdmUoc3RhdGUsIG1vdmUub3JpZywgZGVzdCwgbW92ZS5pbmRleCkgJiYgcmVzO1xuICAgICAgbW92ZS5pbmRleCAtPSBkcm9wO1xuICAgICAgbW92ZS5vcmlnID0gZGVzdDtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmVzO1xufVxuXG4vKlxuVGVzdCBtb3ZlOlxub3JpZ1BpZWNlID0ge2JlbGxvdzogW3tjb2xvcjogXCJCbGFja1wifV0sIGNvbG9yOiBcIldoaXRlXCJ9XG5kZXN0UGllY2UgPSB7Y29sb3I6IFwiQmxhY2tcIn1cbnN0YXRlID0ge3BpZWNlczogbmV3IE1hcCgpfVxuc3RhdGUucGllY2VzLnNldChcImExXCIsIG9yaWdQaWVjZSlcbnN0YXRlLnBpZWNlcy5zZXQoXCJhMlwiLCBkZXN0UGllY2UpXG5vcmlnID0gXCJhMVwiXG5kZXN0ID0gXCJhMlwiXG5pbmRleCA9IDBcbiovXG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlTW92ZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgb3JpZzogY2cuS2V5LCBkZXN0OiBjZy5LZXksIGluZGV4OiBudW1iZXIgPSAxKTogYm9vbGVhbiB7XG4gIGNvbnN0IG9yaWdQaWVjZSA9IHN0YXRlLnBpZWNlcy5nZXQob3JpZyksXG4gICAgZGVzdFBpZWNlID0gc3RhdGUucGllY2VzLmdldChkZXN0KTtcbiAgaW5kZXggPSBpbmRleCAtIDE7IC8vIHRvIGNvcnJlY3QgZm9yIGluZGV4O1xuICBpZiAob3JpZyA9PT0gZGVzdCB8fCAhb3JpZ1BpZWNlKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGNhcHR1cmVkID0gZGVzdFBpZWNlO1xuICBpZiAoZGVzdCA9PT0gc3RhdGUuc2VsZWN0ZWQpIHVuc2VsZWN0KHN0YXRlKTtcbiAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5ldmVudHMubW92ZSwgb3JpZywgZGVzdCwgY2FwdHVyZWQpO1xuICBpZiAoIXRyeUF1dG9DYXN0bGUoc3RhdGUsIG9yaWcsIGRlc3QpKSB7XG4gICAgaWYgKG9yaWdQaWVjZS5iZWxsb3cgJiYgb3JpZ1BpZWNlLmJlbGxvdy5sZW5ndGgtaW5kZXggPiAwKSB7XG4gICAgICBsZXQgbGVmdFBpZWNlcyA9IG9yaWdQaWVjZS5iZWxsb3cuc3BsaWNlKGluZGV4LCBvcmlnUGllY2UuYmVsbG93Lmxlbmd0aClcbiAgICAgIGxldCBuZXdUb3AgPSBsZWZ0UGllY2VzLnNoaWZ0KCkhO1xuICAgICAgbmV3VG9wLmJlbGxvdyA9IGxlZnRQaWVjZXM7IC8vIGFmZmVjdHMgdGhlIHBpZWNlIHRoYXQgd2lsbCBiZSBwbGFjZSBvbiBkZXN0XG4gICAgICBzdGF0ZS5waWVjZXMuc2V0KG9yaWcsIG5ld1RvcCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgc3RhdGUucGllY2VzLmRlbGV0ZShvcmlnKTtcbiAgICB9XG4gICAgaWYgKGRlc3RQaWVjZSkge1xuICAgICAgbGV0IHBpZWNlID0gb3JpZ1BpZWNlO1xuICAgICAgcGllY2UuYmVsbG93ID0gKHBpZWNlLmJlbGxvdyA/PyBbXSkuY29uY2F0KFtkZXN0UGllY2VdLmNvbmNhdChkZXN0UGllY2UuYmVsbG93ID8/IFtdKSlcbiAgICAgIHN0YXRlLnBpZWNlcy5zZXQoZGVzdCwgcGllY2UpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHN0YXRlLnBpZWNlcy5zZXQoZGVzdCwgb3JpZ1BpZWNlKTtcbiAgICB9XG4gICAgLy9zdGF0ZS5waWVjZXMuZGVsZXRlKG9yaWcpOyBUT0RPOiBpZiBvcmlnIHN0YWNrIGlzIGVtcHR5IGRlbGV0ZVxuICB9XG4gIHN0YXRlLmxhc3RNb3ZlID0gW29yaWcsIGRlc3RdO1xuICBpZiAoc3RhdGUucGllY2VzLmdldChkZXN0KSAmJiBzdGF0ZS5waWVjZXMuZ2V0KGRlc3QpIS5iZWxsb3cgJiYgc3RhdGUucGllY2VzLmdldChkZXN0KSEuYmVsbG93IS5sZW5ndGggKyAxID4gc3RhdGUubWF4SW5kZXgpIHtcbiAgICBzdGF0ZS5tYXhJbmRleCA9IHN0YXRlLnBpZWNlcy5nZXQoZGVzdCkhLmJlbGxvdyEubGVuZ3RoICsgMTtcbiAgfVxuICBzdGF0ZS5jaGVjayA9IHVuZGVmaW5lZDtcbiAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5ldmVudHMuY2hhbmdlKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlTmV3UGllY2Uoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIHBpZWNlOiBjZy5QaWVjZSwga2V5OiBjZy5LZXksIGZvcmNlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBpZiAoc3RhdGUucGllY2VzLmhhcyhrZXkpKSB7XG4gICAgaWYgKGZvcmNlKSBzdGF0ZS5waWVjZXMuZGVsZXRlKGtleSk7XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5ldmVudHMuZHJvcE5ld1BpZWNlLCBwaWVjZSwga2V5KTtcbiAgc3RhdGUucGllY2VzLnNldChrZXksIHBpZWNlKTtcbiAgc3RhdGUubGFzdE1vdmUgPSBba2V5XTtcbiAgc3RhdGUuY2hlY2sgPSB1bmRlZmluZWQ7XG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUuZXZlbnRzLmNoYW5nZSk7XG4gIHN0YXRlLm1vdmFibGUuZGVzdHMgPSB1bmRlZmluZWQ7XG4gIHN0YXRlLnR1cm5Db2xvciA9IG9wcG9zaXRlKHN0YXRlLnR1cm5Db2xvcik7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBiYXNlVXNlck1vdmUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG9yaWc6IGNnLktleSwgZGVzdDogY2cuS2V5KTogY2cuUGllY2UgfCBib29sZWFuIHtcbiAgY29uc3QgcmVzdWx0ID0gYmFzZU1vdmUoc3RhdGUsIG9yaWcsIGRlc3QsIHN0YXRlLmN1cnJJbmRleCk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VyTW92ZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgb3JpZzogY2cuS2V5LCBkZXN0OiBjZy5LZXkpOiBib29sZWFuIHtcbiAgaWYgKGNhbk1vdmUoc3RhdGUsIG9yaWcsIGRlc3QpKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYmFzZVVzZXJNb3ZlKHN0YXRlLCBvcmlnLCBkZXN0KTtcbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICBjb25zdCBob2xkVGltZSA9IHN0YXRlLmhvbGQuc3RvcCgpO1xuICAgICAgdW5zZWxlY3Qoc3RhdGUpO1xuICAgICAgY29uc3QgbWV0YWRhdGE6IGNnLk1vdmVNZXRhZGF0YSA9IHtcbiAgICAgICAgcHJlbW92ZTogZmFsc2UsXG4gICAgICAgIGN0cmxLZXk6IHN0YXRlLnN0YXRzLmN0cmxLZXksXG4gICAgICAgIGhvbGRUaW1lLFxuICAgICAgfTtcbiAgICAgIGlmIChzdGF0ZS5jdXJySW5kZXggPT09IHN0YXRlLmluZGV4KSB7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICBzdGF0ZS5tb3ZhYmxlLmRlc3RzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHN0YXRlLnR1cm5Db2xvciA9IG9wcG9zaXRlKHN0YXRlLnR1cm5Db2xvcik7XG4gICAgICAgICAgc3RhdGUuYW5pbWF0aW9uLmN1cnJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW92ZSA9IHN0YXRlLmJ1aWxkaW5nTW92ZVxuICAgICAgICAgID8gey4uLnN0YXRlLmJ1aWxkaW5nTW92ZSwgZHJvcHM6IFsuLi5zdGF0ZS5idWlsZGluZ01vdmUuZHJvcHMsIHN0YXRlLmluZGV4XX1cbiAgICAgICAgICA6IHtpbmRleDogc3RhdGUuY3VyckluZGV4LCBvcmlnOiBvcmlnLCBkaXI6IGtleXNUb0RpcihvcmlnLCBkZXN0KSwgZHJvcHM6IFtzdGF0ZS5pbmRleF19IGFzIGNnLk1vdmU7XG4gICAgICAgIHN0YXRlLmN1cnJJbmRleCA9IDEwOyAvLyB0dXJuIG9mZlxuICAgICAgICBzdGF0ZS5idWlsZGluZ01vdmUgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChyZXN1bHQgIT09IHRydWUpIG1ldGFkYXRhLmNhcHR1cmVkID0gcmVzdWx0O1xuICAgICAgICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLm1vdmFibGUuZXZlbnRzLmFmdGVyLCBtb3ZlLCBtZXRhZGF0YSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgaWYgKHN0YXRlLmJ1aWxkaW5nTW92ZSkge1xuICAgICAgICAgIHN0YXRlLmJ1aWxkaW5nTW92ZSA9IHsuLi5zdGF0ZS5idWlsZGluZ01vdmUsIGRyb3BzOiBbLi4uc3RhdGUuYnVpbGRpbmdNb3ZlLmRyb3BzLCBzdGF0ZS5jdXJySW5kZXggLSBzdGF0ZS5pbmRleF19O1xuICAgICAgICAgIHN0YXRlLmN1cnJJbmRleCA9IHN0YXRlLmN1cnJJbmRleCAtIHN0YXRlLmluZGV4O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHN0YXRlLmJ1aWxkaW5nTW92ZSA9IHtpbmRleDogc3RhdGUuY3VyckluZGV4LCBvcmlnOiBvcmlnLCBkaXI6IGtleXNUb0RpcihvcmlnLCBkZXN0KSwgZHJvcHM6IFtzdGF0ZS5jdXJySW5kZXggLSBzdGF0ZS5pbmRleF19IGFzIGNnLk1vdmU7XG4gICAgICAgICAgc2V0U2VsZWN0ZWQoc3RhdGUsIGRlc3QpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtb3ZlVG8oZGVzdCwga2V5c1RvRGlyKG9yaWcsIGRlc3QpKSkge1xuICAgICAgICAgIHN0YXRlLm1vdmFibGUuZGVzdHM/LnNldChkZXN0LCBbbW92ZVRvKGRlc3QsIGtleXNUb0RpcihvcmlnLCBkZXN0KSkhXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIGlmIChjYW5QcmVtb3ZlKHN0YXRlLCBvcmlnLCBkZXN0KSkge1xuICAgIHNldFByZW1vdmUoc3RhdGUsIG9yaWcsIGRlc3QsIHtcbiAgICAgIGN0cmxLZXk6IHN0YXRlLnN0YXRzLmN0cmxLZXksXG4gICAgfSk7XG4gICAgdW5zZWxlY3Qoc3RhdGUpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHVuc2VsZWN0KHN0YXRlKTtcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZHJvcE5ld1BpZWNlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBvcmlnOiBjZy5LZXksIGRlc3Q6IGNnLktleSwgZm9yY2U/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHBpZWNlID0gc3RhdGUucGllY2VzLmdldChvcmlnKTtcbiAgaWYgKHBpZWNlICYmIChjYW5Ecm9wKHN0YXRlLCBvcmlnLCBkZXN0KSB8fCBmb3JjZSkpIHtcbiAgICBzdGF0ZS5waWVjZXMuZGVsZXRlKG9yaWcpO1xuICAgIGJhc2VOZXdQaWVjZShzdGF0ZSwgcGllY2UsIGRlc3QsIGZvcmNlKTtcbiAgICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLm1vdmFibGUuZXZlbnRzLmFmdGVyTmV3UGllY2UsIHBpZWNlLnJvbGUsIGRlc3QsIHtcbiAgICAgIHByZW1vdmU6IGZhbHNlLFxuICAgICAgcHJlZHJvcDogZmFsc2UsXG4gICAgfSk7XG4gIH0gZWxzZSBpZiAocGllY2UgJiYgY2FuUHJlZHJvcChzdGF0ZSwgb3JpZywgZGVzdCkpIHtcbiAgICBzZXRQcmVkcm9wKHN0YXRlLCBwaWVjZS5yb2xlLCBkZXN0KTtcbiAgfSBlbHNlIHtcbiAgICB1bnNldFByZW1vdmUoc3RhdGUpO1xuICAgIHVuc2V0UHJlZHJvcChzdGF0ZSk7XG4gIH1cbiAgc3RhdGUucGllY2VzLmRlbGV0ZShvcmlnKTtcbiAgdW5zZWxlY3Qoc3RhdGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0U3F1YXJlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBrZXk6IGNnLktleSwgZm9yY2U/OiBib29sZWFuKTogdm9pZCB7XG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUuZXZlbnRzLnNlbGVjdCwga2V5KTtcbiAgaWYgKHN0YXRlLnNlbGVjdGVkKSB7XG4gICAgaWYgKHN0YXRlLnNlbGVjdGVkID09PSBrZXkgJiYgIXN0YXRlLmRyYWdnYWJsZS5lbmFibGVkKSB7XG4gICAgICB1bnNlbGVjdChzdGF0ZSk7XG4gICAgICBzdGF0ZS5ob2xkLmNhbmNlbCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoKHN0YXRlLnNlbGVjdGFibGUuZW5hYmxlZCB8fCBmb3JjZSkgJiYgc3RhdGUuc2VsZWN0ZWQgIT09IGtleSkge1xuICAgICAgaWYgKHVzZXJNb3ZlKHN0YXRlLCBzdGF0ZS5zZWxlY3RlZCwga2V5KSkge1xuICAgICAgICBzdGF0ZS5zdGF0cy5kcmFnZ2VkID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGlzTW92YWJsZShzdGF0ZSwga2V5KSB8fCBpc1ByZW1vdmFibGUoc3RhdGUsIGtleSkpIHtcbiAgICBzZXRTZWxlY3RlZChzdGF0ZSwga2V5KTtcbiAgICBzdGF0ZS5ob2xkLnN0YXJ0KCk7XG4gIH0gZWxzZSB7XG4gICAgc3RhdGUuY3VyckluZGV4ID0gMTA7IC8vIHR1cm4gb2ZmXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFNlbGVjdGVkKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBrZXk6IGNnLktleSk6IHZvaWQge1xuICBzdGF0ZS5zZWxlY3RlZCA9IGtleTtcbiAgY29uc3QgcGllY2UgPSBzdGF0ZS5waWVjZXMuZ2V0KGtleSk7XG4gIGlmIChwaWVjZSAmJiBwaWVjZSEuYmVsbG93KSB7XG4gICAgc3RhdGUuaW5kZXggPSBNYXRoLm1pbihzdGF0ZS5pbmRleCwgcGllY2UuYmVsbG93IS5sZW5ndGggKyAxKVxuICB9XG4gIGVsc2Uge1xuICAgIHN0YXRlLmluZGV4ID0gMVxuICB9XG4gIHN0YXRlLmN1cnJJbmRleCA9IHN0YXRlLmluZGV4O1xuICBpZiAoaXNQcmVtb3ZhYmxlKHN0YXRlLCBrZXkpKSB7XG4gICAgc3RhdGUucHJlbW92YWJsZS5kZXN0cyA9IHByZW1vdmUoc3RhdGUucGllY2VzLCBrZXksIHN0YXRlLnByZW1vdmFibGUuY2FzdGxlKTtcbiAgfSBlbHNlIHN0YXRlLnByZW1vdmFibGUuZGVzdHMgPSB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bnNlbGVjdChzdGF0ZTogSGVhZGxlc3NTdGF0ZSk6IHZvaWQge1xuICBzdGF0ZS5zZWxlY3RlZCA9IHVuZGVmaW5lZDtcbiAgc3RhdGUucHJlbW92YWJsZS5kZXN0cyA9IHVuZGVmaW5lZDtcbiAgc3RhdGUuaG9sZC5jYW5jZWwoKTtcbn1cblxuZnVuY3Rpb24gaXNNb3ZhYmxlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBvcmlnOiBjZy5LZXkpOiBib29sZWFuIHtcbiAgY29uc3QgcGllY2UgPSBzdGF0ZS5waWVjZXMuZ2V0KG9yaWcpO1xuICByZXR1cm4gKFxuICAgICEhcGllY2UgJiZcbiAgICAoc3RhdGUubW92YWJsZS5jb2xvciA9PT0gJ2JvdGgnIHx8IChzdGF0ZS5tb3ZhYmxlLmNvbG9yID09PSBwaWVjZS5jb2xvciAmJiBzdGF0ZS50dXJuQ29sb3IgPT09IHBpZWNlLmNvbG9yKSlcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbk1vdmUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG9yaWc6IGNnLktleSwgZGVzdDogY2cuS2V5KTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgb3JpZyAhPT0gZGVzdCAmJiBpc01vdmFibGUoc3RhdGUsIG9yaWcpICYmIChzdGF0ZS5tb3ZhYmxlLmZyZWUgfHwgISFzdGF0ZS5tb3ZhYmxlLmRlc3RzPy5nZXQob3JpZyk/LmluY2x1ZGVzKGRlc3QpKVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FuVGFrTW92ZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgbW92ZTogY2cuTW92ZSk6IGJvb2xlYW4ge1xuICBjb25zdCBkZXN0ID0gbW92ZVRvKG1vdmUub3JpZywgbW92ZS5kaXIpO1xuICByZXR1cm4gZGVzdCA/IGNhbk1vdmUoc3RhdGUsIG1vdmUub3JpZywgZGVzdCkgOiBmYWxzZTtcbn1cblxuXG5mdW5jdGlvbiBjYW5Ecm9wKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBvcmlnOiBjZy5LZXksIGRlc3Q6IGNnLktleSk6IGJvb2xlYW4ge1xuICBjb25zdCBwaWVjZSA9IHN0YXRlLnBpZWNlcy5nZXQob3JpZyk7XG4gIHJldHVybiAoXG4gICAgISFwaWVjZSAmJlxuICAgIChvcmlnID09PSBkZXN0IHx8ICFzdGF0ZS5waWVjZXMuaGFzKGRlc3QpKSAmJlxuICAgIChzdGF0ZS5tb3ZhYmxlLmNvbG9yID09PSAnYm90aCcgfHwgKHN0YXRlLm1vdmFibGUuY29sb3IgPT09IHBpZWNlLmNvbG9yICYmIHN0YXRlLnR1cm5Db2xvciA9PT0gcGllY2UuY29sb3IpKVxuICApO1xufVxuXG5mdW5jdGlvbiBpc1ByZW1vdmFibGUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG9yaWc6IGNnLktleSk6IGJvb2xlYW4ge1xuICBjb25zdCBwaWVjZSA9IHN0YXRlLnBpZWNlcy5nZXQob3JpZyk7XG4gIHJldHVybiAhIXBpZWNlICYmIHN0YXRlLnByZW1vdmFibGUuZW5hYmxlZCAmJiBzdGF0ZS5tb3ZhYmxlLmNvbG9yID09PSBwaWVjZS5jb2xvciAmJiBzdGF0ZS50dXJuQ29sb3IgIT09IHBpZWNlLmNvbG9yO1xufVxuXG5mdW5jdGlvbiBjYW5QcmVtb3ZlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBvcmlnOiBjZy5LZXksIGRlc3Q6IGNnLktleSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIG9yaWcgIT09IGRlc3QgJiYgaXNQcmVtb3ZhYmxlKHN0YXRlLCBvcmlnKSAmJiBwcmVtb3ZlKHN0YXRlLnBpZWNlcywgb3JpZywgc3RhdGUucHJlbW92YWJsZS5jYXN0bGUpLmluY2x1ZGVzKGRlc3QpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGNhblByZWRyb3Aoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG9yaWc6IGNnLktleSwgZGVzdDogY2cuS2V5KTogYm9vbGVhbiB7XG4gIGNvbnN0IHBpZWNlID0gc3RhdGUucGllY2VzLmdldChvcmlnKTtcbiAgY29uc3QgZGVzdFBpZWNlID0gc3RhdGUucGllY2VzLmdldChkZXN0KTtcbiAgcmV0dXJuIChcbiAgICAhIXBpZWNlICYmXG4gICAgKCFkZXN0UGllY2UgfHwgZGVzdFBpZWNlLmNvbG9yICE9PSBzdGF0ZS5tb3ZhYmxlLmNvbG9yKSAmJlxuICAgIHN0YXRlLnByZWRyb3BwYWJsZS5lbmFibGVkICYmXG4gICAgKHBpZWNlLnJvbGUgIT09ICdwYXduJyB8fCAoZGVzdFsxXSAhPT0gJzEnICYmIGRlc3RbMV0gIT09ICc4JykpICYmXG4gICAgc3RhdGUubW92YWJsZS5jb2xvciA9PT0gcGllY2UuY29sb3IgJiZcbiAgICBzdGF0ZS50dXJuQ29sb3IgIT09IHBpZWNlLmNvbG9yXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RyYWdnYWJsZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgb3JpZzogY2cuS2V5KTogYm9vbGVhbiB7XG4gIGNvbnN0IHBpZWNlID0gc3RhdGUucGllY2VzLmdldChvcmlnKTtcbiAgcmV0dXJuIChcbiAgICAhIXBpZWNlICYmXG4gICAgc3RhdGUuZHJhZ2dhYmxlLmVuYWJsZWQgJiZcbiAgICAoc3RhdGUubW92YWJsZS5jb2xvciA9PT0gJ2JvdGgnIHx8XG4gICAgICAoc3RhdGUubW92YWJsZS5jb2xvciA9PT0gcGllY2UuY29sb3IgJiYgKHN0YXRlLnR1cm5Db2xvciA9PT0gcGllY2UuY29sb3IgfHwgc3RhdGUucHJlbW92YWJsZS5lbmFibGVkKSkpXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwbGF5UHJlbW92ZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSk6IGJvb2xlYW4ge1xuICBjb25zdCBtb3ZlID0gc3RhdGUucHJlbW92YWJsZS5jdXJyZW50O1xuICBpZiAoIW1vdmUpIHJldHVybiBmYWxzZTtcbiAgbGV0IHN1Y2Nlc3MgPSBmYWxzZTtcbiAgaWYgKGNhblRha01vdmUoc3RhdGUsIG1vdmUpKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYmFzZVVzZXJNb3ZlKHN0YXRlLCBtb3ZlLm9yaWcsIG1vdmVUbyhtb3ZlLm9yaWcsIG1vdmUuZGlyKSEpO1xuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhOiBjZy5Nb3ZlTWV0YWRhdGEgPSB7IHByZW1vdmU6IHRydWUgfTtcbiAgICAgIGlmIChyZXN1bHQgIT09IHRydWUpIG1ldGFkYXRhLmNhcHR1cmVkID0gcmVzdWx0O1xuICAgICAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5tb3ZhYmxlLmV2ZW50cy5hZnRlciwgbW92ZSwgbWV0YWRhdGEpO1xuICAgICAgc3VjY2VzcyA9IHRydWU7XG4gICAgfVxuICB9XG4gIHVuc2V0UHJlbW92ZShzdGF0ZSk7XG4gIHJldHVybiBzdWNjZXNzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGxheVByZWRyb3Aoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIHZhbGlkYXRlOiAoZHJvcDogY2cuRHJvcCkgPT4gYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBkcm9wID0gc3RhdGUucHJlZHJvcHBhYmxlLmN1cnJlbnQ7XG4gIGxldCBzdWNjZXNzID0gZmFsc2U7XG4gIGlmICghZHJvcCkgcmV0dXJuIGZhbHNlO1xuICBpZiAodmFsaWRhdGUoZHJvcCkpIHtcbiAgICBjb25zdCBwaWVjZSA9IHtcbiAgICAgIHJvbGU6IGRyb3Aucm9sZSxcbiAgICAgIGNvbG9yOiBzdGF0ZS5tb3ZhYmxlLmNvbG9yLFxuICAgIH0gYXMgY2cuUGllY2U7XG4gICAgaWYgKGJhc2VOZXdQaWVjZShzdGF0ZSwgcGllY2UsIGRyb3Aua2V5KSkge1xuICAgICAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5tb3ZhYmxlLmV2ZW50cy5hZnRlck5ld1BpZWNlLCBkcm9wLnJvbGUsIGRyb3Aua2V5LCB7XG4gICAgICAgIHByZW1vdmU6IGZhbHNlLFxuICAgICAgICBwcmVkcm9wOiB0cnVlLFxuICAgICAgfSk7XG4gICAgICBzdWNjZXNzID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgdW5zZXRQcmVkcm9wKHN0YXRlKTtcbiAgcmV0dXJuIHN1Y2Nlc3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5jZWxNb3ZlKHN0YXRlOiBIZWFkbGVzc1N0YXRlKTogdm9pZCB7XG4gIHVuc2V0UHJlbW92ZShzdGF0ZSk7XG4gIHVuc2V0UHJlZHJvcChzdGF0ZSk7XG4gIHVuc2VsZWN0KHN0YXRlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3Aoc3RhdGU6IEhlYWRsZXNzU3RhdGUpOiB2b2lkIHtcbiAgc3RhdGUubW92YWJsZS5jb2xvciA9IHN0YXRlLm1vdmFibGUuZGVzdHMgPSBzdGF0ZS5hbmltYXRpb24uY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgY2FuY2VsTW92ZShzdGF0ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRLZXlBdERvbVBvcyhwb3M6IGNnLk51bWJlclBhaXIsIGFzV2hpdGU6IGJvb2xlYW4sIGJvdW5kczogQ2xpZW50UmVjdCk6IGNnLktleSB8IHVuZGVmaW5lZCB7XG4gIGxldCBmaWxlID0gTWF0aC5mbG9vcigoOCAqIChwb3NbMF0gLSBib3VuZHMubGVmdCkpIC8gYm91bmRzLndpZHRoKTtcbiAgaWYgKCFhc1doaXRlKSBmaWxlID0gNyAtIGZpbGU7XG4gIGxldCByYW5rID0gNyAtIE1hdGguZmxvb3IoKDggKiAocG9zWzFdIC0gYm91bmRzLnRvcCkpIC8gYm91bmRzLmhlaWdodCk7XG4gIGlmICghYXNXaGl0ZSkgcmFuayA9IDcgLSByYW5rO1xuICByZXR1cm4gZmlsZSA+PSAwICYmIGZpbGUgPCA4ICYmIHJhbmsgPj0gMCAmJiByYW5rIDwgOCA/IHBvczJrZXkoW2ZpbGUsIHJhbmtdKSA6IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNuYXBwZWRLZXlBdERvbVBvcyhcbiAgb3JpZzogY2cuS2V5LFxuICBwb3M6IGNnLk51bWJlclBhaXIsXG4gIGFzV2hpdGU6IGJvb2xlYW4sXG4gIGJvdW5kczogQ2xpZW50UmVjdFxuKTogY2cuS2V5IHwgdW5kZWZpbmVkIHtcbiAgY29uc3Qgb3JpZ1BvcyA9IGtleTJwb3Mob3JpZyk7XG4gIGNvbnN0IHZhbGlkU25hcFBvcyA9IGFsbFBvcy5maWx0ZXIocG9zMiA9PiB7XG4gICAgcmV0dXJuIHF1ZWVuKG9yaWdQb3NbMF0sIG9yaWdQb3NbMV0sIHBvczJbMF0sIHBvczJbMV0pIHx8IGtuaWdodChvcmlnUG9zWzBdLCBvcmlnUG9zWzFdLCBwb3MyWzBdLCBwb3MyWzFdKTtcbiAgfSk7XG4gIGNvbnN0IHZhbGlkU25hcENlbnRlcnMgPSB2YWxpZFNuYXBQb3MubWFwKHBvczIgPT4gY29tcHV0ZVNxdWFyZUNlbnRlcihwb3Mya2V5KHBvczIpLCBhc1doaXRlLCBib3VuZHMpKTtcbiAgY29uc3QgdmFsaWRTbmFwRGlzdGFuY2VzID0gdmFsaWRTbmFwQ2VudGVycy5tYXAocG9zMiA9PiBkaXN0YW5jZVNxKHBvcywgcG9zMikpO1xuICBjb25zdCBbLCBjbG9zZXN0U25hcEluZGV4XSA9IHZhbGlkU25hcERpc3RhbmNlcy5yZWR1Y2UoKGEsIGIsIGluZGV4KSA9PiAoYVswXSA8IGIgPyBhIDogW2IsIGluZGV4XSksIFtcbiAgICB2YWxpZFNuYXBEaXN0YW5jZXNbMF0sXG4gICAgMCxcbiAgXSk7XG4gIHJldHVybiBwb3Mya2V5KHZhbGlkU25hcFBvc1tjbG9zZXN0U25hcEluZGV4XSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3aGl0ZVBvdihzOiBIZWFkbGVzc1N0YXRlKTogYm9vbGVhbiB7XG4gIHJldHVybiBzLm9yaWVudGF0aW9uID09PSAnd2hpdGUnO1xufVxuIl19
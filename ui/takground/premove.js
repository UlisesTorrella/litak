"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.premove = exports.wallstone = exports.capstone = exports.flatstone = exports.queen = exports.knight = void 0;
const util = require("./util");
function diff(a, b) {
    return Math.abs(a - b);
}
function pawn(color) {
    return (x1, y1, x2, y2) => diff(x1, x2) < 2 &&
        (color === 'white'
            ? // allow 2 squares from first two ranks, for horde
                y2 === y1 + 1 || (y1 <= 1 && y2 === y1 + 2 && x1 === x2)
            : y2 === y1 - 1 || (y1 >= 6 && y2 === y1 - 2 && x1 === x2));
}
const knight = (x1, y1, x2, y2) => {
    const xd = diff(x1, x2);
    const yd = diff(y1, y2);
    return (xd === 1 && yd === 2) || (xd === 2 && yd === 1);
};
exports.knight = knight;
const bishop = (x1, y1, x2, y2) => {
    return diff(x1, x2) === diff(y1, y2);
};
const rook = (x1, y1, x2, y2) => {
    return x1 === x2 || y1 === y2;
};
const queen = (x1, y1, x2, y2) => {
    return bishop(x1, y1, x2, y2) || rook(x1, y1, x2, y2);
};
exports.queen = queen;
function king(color, rookFiles, canCastle) {
    return (x1, y1, x2, y2) => (diff(x1, x2) < 2 && diff(y1, y2) < 2) ||
        (canCastle &&
            y1 === y2 &&
            y1 === (color === 'white' ? 0 : 7) &&
            ((x1 === 4 && ((x2 === 2 && rookFiles.includes(0)) || (x2 === 6 && rookFiles.includes(7)))) ||
                rookFiles.includes(x2)));
}
const flatstone = (x1, y1, x2, y2) => {
    return (diff(x1, x2) < 2 && diff(y1, y2) == 0 || diff(x1, x2) == 0 && diff(y1, y2) < 2);
};
exports.flatstone = flatstone;
const capstone = (x1, y1, x2, y2) => {
    return exports.flatstone(x1, y1, x2, y2);
};
exports.capstone = capstone;
const wallstone = (x1, y1, x2, y2) => {
    return exports.flatstone(x1, y1, x2, y2);
};
exports.wallstone = wallstone;
function rookFilesOf(pieces, color) {
    const backrank = color === 'white' ? '1' : '8';
    const files = [];
    for (const [key, piece] of pieces) {
        if (key[1] === backrank && piece.color === color && piece.role === 'rook') {
            files.push(util.key2pos(key)[0]);
        }
    }
    return files;
}
function premove(pieces, key, canCastle) {
    const piece = pieces.get(key);
    if (!piece)
        return [];
    const pos = util.key2pos(key), r = piece.role, mobility = r === 'pawn'
        ? pawn(piece.color)
        : r === 'knight'
            ? exports.knight
            : r === 'bishop'
                ? bishop
                : r === 'rook'
                    ? rook
                    : r === 'flatstone'
                        ? exports.flatstone
                        : r === 'capstone'
                            ? exports.capstone
                            : r === 'wallstone'
                                ? exports.wallstone
                                : r === 'queen'
                                    ? exports.queen
                                    : king(piece.color, rookFilesOf(pieces, piece.color), canCastle);
    return util.allPos
        .filter(pos2 => (pos[0] !== pos2[0] || pos[1] !== pos2[1]) && mobility(pos[0], pos[1], pos2[0], pos2[1]))
        .map(util.pos2key);
}
exports.premove = premove;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbW92ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9wcmVtb3ZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtCQUErQjtBQUsvQixTQUFTLElBQUksQ0FBQyxDQUFTLEVBQUUsQ0FBUztJQUNoQyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUM7QUFFRCxTQUFTLElBQUksQ0FBQyxLQUFlO0lBQzNCLE9BQU8sQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUN4QixJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUM7UUFDaEIsQ0FBQyxLQUFLLEtBQUssT0FBTztZQUNoQixDQUFDLENBQUMsa0RBQWtEO2dCQUNsRCxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQztZQUMxRCxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2xFLENBQUM7QUFFTSxNQUFNLE1BQU0sR0FBYSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0lBQ2pELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDeEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4QixPQUFPLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FB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TUFBTTtvQkFDZCxDQUFDLENBQUMsSUFBSTtvQkFDTixDQUFDLENBQUMsQ0FBQyxLQUFLLFdBQVc7d0JBQ25CLENBQUMsQ0FBQyxpQkFBUzt3QkFDWCxDQUFDLENBQUMsQ0FBQyxLQUFLLFVBQVU7NEJBQ2xCLENBQUMsQ0FBQyxnQkFBUTs0QkFDVixDQUFDLENBQUMsQ0FBQyxLQUFLLFdBQVc7Z0NBQ25CLENBQUMsQ0FBQyxpQkFBUztnQ0FDWCxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU87b0NBQ2YsQ0FBQyxDQUFDLGFBQUs7b0NBQ1AsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZFLE9BQU8sSUFBSSxDQUFDLE1BQU07U0FDZixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN4RyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZCLENBQUM7QUExQkQsMEJBMEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdXRpbCBmcm9tICcuL3V0aWwnO1xuaW1wb3J0ICogYXMgY2cgZnJvbSAnLi90eXBlcyc7XG5cbnR5cGUgTW9iaWxpdHkgPSAoeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgPT4gYm9vbGVhbjtcblxuZnVuY3Rpb24gZGlmZihhOiBudW1iZXIsIGI6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLmFicyhhIC0gYik7XG59XG5cbmZ1bmN0aW9uIHBhd24oY29sb3I6IGNnLkNvbG9yKTogTW9iaWxpdHkge1xuICByZXR1cm4gKHgxLCB5MSwgeDIsIHkyKSA9PlxuICAgIGRpZmYoeDEsIHgyKSA8IDIgJiZcbiAgICAoY29sb3IgPT09ICd3aGl0ZSdcbiAgICAgID8gLy8gYWxsb3cgMiBzcXVhcmVzIGZyb20gZmlyc3QgdHdvIHJhbmtzLCBmb3IgaG9yZGVcbiAgICAgICAgeTIgPT09IHkxICsgMSB8fCAoeTEgPD0gMSAmJiB5MiA9PT0geTEgKyAyICYmIHgxID09PSB4MilcbiAgICAgIDogeTIgPT09IHkxIC0gMSB8fCAoeTEgPj0gNiAmJiB5MiA9PT0geTEgLSAyICYmIHgxID09PSB4MikpO1xufVxuXG5leHBvcnQgY29uc3Qga25pZ2h0OiBNb2JpbGl0eSA9ICh4MSwgeTEsIHgyLCB5MikgPT4ge1xuICBjb25zdCB4ZCA9IGRpZmYoeDEsIHgyKTtcbiAgY29uc3QgeWQgPSBkaWZmKHkxLCB5Mik7XG4gIHJldHVybiAoeGQgPT09IDEgJiYgeWQgPT09IDIpIHx8ICh4ZCA9PT0gMiAmJiB5ZCA9PT0gMSk7XG59O1xuXG5jb25zdCBiaXNob3A6IE1vYmlsaXR5ID0gKHgxLCB5MSwgeDIsIHkyKSA9PiB7XG4gIHJldHVybiBkaWZmKHgxLCB4MikgPT09IGRpZmYoeTEsIHkyKTtcbn07XG5cbmNvbnN0IHJvb2s6IE1vYmlsaXR5ID0gKHgxLCB5MSwgeDIsIHkyKSA9PiB7XG4gIHJldHVybiB4MSA9PT0geDIgfHwgeTEgPT09IHkyO1xufTtcblxuZXhwb3J0IGNvbnN0IHF1ZWVuOiBNb2JpbGl0eSA9ICh4MSwgeTEsIHgyLCB5MikgPT4ge1xuICByZXR1cm4gYmlzaG9wKHgxLCB5MSwgeDIsIHkyKSB8fCByb29rKHgxLCB5MSwgeDIsIHkyKTtcbn07XG5cbmZ1bmN0aW9uIGtpbmcoY29sb3I6IGNnLkNvbG9yLCByb29rRmlsZXM6IG51bWJlcltdLCBjYW5DYXN0bGU6IGJvb2xlYW4pOiBNb2JpbGl0eSB7XG4gIHJldHVybiAoeDEsIHkxLCB4MiwgeTIpID0+XG4gICAgKGRpZmYoeDEsIHgyKSA8IDIgJiYgZGlmZih5MSwgeTIpIDwgMikgfHxcbiAgICAoY2FuQ2FzdGxlICYmXG4gICAgICB5MSA9PT0geTIgJiZcbiAgICAgIHkxID09PSAoY29sb3IgPT09ICd3aGl0ZScgPyAwIDogNykgJiZcbiAgICAgICgoeDEgPT09IDQgJiYgKCh4MiA9PT0gMiAmJiByb29rRmlsZXMuaW5jbHVkZXMoMCkpIHx8ICh4MiA9PT0gNiAmJiByb29rRmlsZXMuaW5jbHVkZXMoNykpKSkgfHxcbiAgICAgICAgcm9va0ZpbGVzLmluY2x1ZGVzKHgyKSkpO1xufVxuXG5leHBvcnQgY29uc3QgZmxhdHN0b25lOiBNb2JpbGl0eSA9ICh4MSwgeTEsIHgyLCB5MikgPT4ge1xuICByZXR1cm4gKGRpZmYoeDEsIHgyKSA8IDIgJiYgZGlmZih5MSwgeTIpID09IDAgfHwgZGlmZih4MSwgeDIpID09IDAgJiYgZGlmZih5MSwgeTIpIDwgMik7XG59XG5cbmV4cG9ydCBjb25zdCBjYXBzdG9uZTogTW9iaWxpdHkgPSAoeDEsIHkxLCB4MiwgeTIpID0+IHtcbiAgcmV0dXJuIGZsYXRzdG9uZSh4MSwgeTEsIHgyLCB5Mik7XG59XG5cbmV4cG9ydCBjb25zdCB3YWxsc3RvbmU6IE1vYmlsaXR5ID0gKHgxLCB5MSwgeDIsIHkyKSA9PiB7XG4gIHJldHVybiBmbGF0c3RvbmUoeDEsIHkxLCB4MiwgeTIpO1xufVxuXG5mdW5jdGlvbiByb29rRmlsZXNPZihwaWVjZXM6IGNnLlBpZWNlcywgY29sb3I6IGNnLkNvbG9yKSB7XG4gIGNvbnN0IGJhY2tyYW5rID0gY29sb3IgPT09ICd3aGl0ZScgPyAnMScgOiAnOCc7XG4gIGNvbnN0IGZpbGVzID0gW107XG4gIGZvciAoY29uc3QgW2tleSwgcGllY2VdIG9mIHBpZWNlcykge1xuICAgIGlmIChrZXlbMV0gPT09IGJhY2tyYW5rICYmIHBpZWNlLmNvbG9yID09PSBjb2xvciAmJiBwaWVjZS5yb2xlID09PSAncm9vaycpIHtcbiAgICAgIGZpbGVzLnB1c2godXRpbC5rZXkycG9zKGtleSlbMF0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmlsZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcmVtb3ZlKHBpZWNlczogY2cuUGllY2VzLCBrZXk6IGNnLktleSwgY2FuQ2FzdGxlOiBib29sZWFuKTogY2cuS2V5W10ge1xuICBjb25zdCBwaWVjZSA9IHBpZWNlcy5nZXQoa2V5KTtcbiAgaWYgKCFwaWVjZSkgcmV0dXJuIFtdO1xuICBjb25zdCBwb3MgPSB1dGlsLmtleTJwb3Moa2V5KSxcbiAgICByID0gcGllY2Uucm9sZSxcbiAgICBtb2JpbGl0eTogTW9iaWxpdHkgPVxuICAgICAgciA9PT0gJ3Bhd24nXG4gICAgICAgID8gcGF3bihwaWVjZS5jb2xvcilcbiAgICAgICAgOiByID09PSAna25pZ2h0J1xuICAgICAgICA/IGtuaWdodFxuICAgICAgICA6IHIgPT09ICdiaXNob3AnXG4gICAgICAgID8gYmlzaG9wXG4gICAgICAgIDogciA9PT0gJ3Jvb2snXG4gICAgICAgID8gcm9va1xuICAgICAgICA6IHIgPT09ICdmbGF0c3RvbmUnXG4gICAgICAgID8gZmxhdHN0b25lXG4gICAgICAgIDogciA9PT0gJ2NhcHN0b25lJ1xuICAgICAgICA/IGNhcHN0b25lXG4gICAgICAgIDogciA9PT0gJ3dhbGxzdG9uZSdcbiAgICAgICAgPyB3YWxsc3RvbmVcbiAgICAgICAgOiByID09PSAncXVlZW4nXG4gICAgICAgID8gcXVlZW5cbiAgICAgICAgOiBraW5nKHBpZWNlLmNvbG9yLCByb29rRmlsZXNPZihwaWVjZXMsIHBpZWNlLmNvbG9yKSwgY2FuQ2FzdGxlKTtcbiAgcmV0dXJuIHV0aWwuYWxsUG9zXG4gICAgLmZpbHRlcihwb3MyID0+IChwb3NbMF0gIT09IHBvczJbMF0gfHwgcG9zWzFdICE9PSBwb3MyWzFdKSAmJiBtb2JpbGl0eShwb3NbMF0sIHBvc1sxXSwgcG9zMlswXSwgcG9zMlsxXSkpXG4gICAgLm1hcCh1dGlsLnBvczJrZXkpO1xufVxuIl19
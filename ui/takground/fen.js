"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.write = exports.read = exports.initial = void 0;
const util_1 = require("./util");
const cg = require("./types");
exports.initial = '8/8/8/8/8/8/8/8';
const roles = {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king',
    f: 'flatstone',
    c: 'capstone',
    w: 'wallstone'
};
const letters = {
    pawn: 'p',
    rook: 'r',
    knight: 'n',
    bishop: 'b',
    queen: 'q',
    king: 'k',
    wallstone: 'w',
    capstone: 'c',
    flatstone: 'f'
};
function read(fen) {
    if (fen === 'start')
        fen = exports.initial;
    const pieces = new Map();
    let row = 7, col = 0;
    let stack = [];
    for (const c of fen) {
        switch (c) {
            case ' ':
                return pieces;
            case '/':
                --row;
                if (row < 0)
                    return pieces;
                col = 0;
                break;
            default:
                const nb = c.charCodeAt(0);
                if (nb == 40) {
                    stack = [];
                }
                else if (nb == 41) {
                    let piece = stack[0];
                    piece.bellow = stack.splice(1);
                    pieces.set(util_1.pos2key([col, row]), piece); // TODO: handle stacks
                    ++col;
                }
                else if (nb < 57)
                    col += nb - 48;
                else {
                    const role = c.toLowerCase();
                    stack.push({
                        role: roles[role],
                        color: c === role ? 'black' : 'white',
                    });
                }
        }
    }
    return pieces;
}
exports.read = read;
function write(pieces) {
    return util_1.invRanks
        .map(y => cg.files
        .map(x => {
        const piece = pieces.get((x + y));
        if (piece) {
            const letter = letters[piece.role];
            return piece.color === 'white' ? letter.toUpperCase() : letter;
        }
        else
            return '1';
    })
        .join(''))
        .join('/')
        .replace(/1{2,}/g, s => s.length.toString());
}
exports.write = write;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3JjL2Zlbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBMkM7QUFDM0MsOEJBQThCO0FBRWpCLFFBQUEsT0FBTyxHQUFXLGlCQUFpQixDQUFDO0FBRWpELE1BQU0sS0FBSyxHQUFrQztJQUMzQyxDQUFDLEVBQUUsTUFBTTtJQUNULENBQUMsRUFBRSxNQUFNO0lBQ1QsQ0FBQyxFQUFFLFFBQVE7SUFDWCxDQUFDLEVBQUUsUUFBUTtJQUNYLENBQUMsRUFBRSxPQUFPO0lBQ1YsQ0FBQyxFQUFFLE1BQU07SUFDVCxDQUFDLEVBQUUsV0FBVztJQUNkLENBQUMsRUFBRSxVQUFVO0lBQ2IsQ0FBQyxFQUFFLFdBQVc7Q0FDZixDQUFDO0FBRUYsTUFBTSxPQUFPLEdBQUc7SUFDZCxJQUFJLEVBQUUsR0FBRztJQUNULElBQUksRUFBRSxHQUFHO0lBQ1QsTUFBTSxFQUFFLEdBQUc7SUFDWCxNQUFNLEVBQUUsR0FBRztJQUNYLEtBQUssRUFBRSxHQUFHO0lBQ1YsSUFBSSxFQUFFLEdBQUc7SUFDVCxTQUFTLEVBQUUsR0FBRztJQUNkLFFBQVEsRUFBRSxHQUFHO0lBQ2IsU0FBUyxFQUFFLEdBQUc7Q0FDZixDQUFDO0FBRUYsU0FBZ0IsSUFBSSxDQUFDLEdBQVc7SUFDOUIsSUFBSSxHQUFHLEtBQUssT0FBTztRQUFFLEdBQUcsR0FBRyxlQUFPLENBQUM7SUFDbkMsTUFBTSxNQUFNLEdBQWMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNwQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQ1AsR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNaLElBQUksS0FBSyxHQUFvQixFQUFFLENBQUM7SUFDaEMsS0FBSyxNQUFNLENBQUMsSUFBSSxHQUFHLEVBQUU7UUFDbkIsUUFBUSxDQUFDLEVBQUU7WUFDVCxLQUFLLEdBQUc7Z0JBQ04sT0FBTyxNQUFNLENBQUM7WUFDaEIsS0FBSyxHQUFHO2dCQUNOLEVBQUUsR0FBRyxDQUFDO2dCQUNOLElBQUksR0FBRyxHQUFHLENBQUM7b0JBQUUsT0FBTyxNQUFNLENBQUM7Z0JBQzNCLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQ1IsTUFBTTtZQUNSO2dCQUNFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNCLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRTtvQkFDWixLQUFLLEdBQUcsRUFBRSxDQUFDO2lCQUNaO3FCQUNJLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRTtvQkFDakIsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQixLQUFLLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQy9CLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxzQkFBc0I7b0JBQzlELEVBQUUsR0FBRyxDQUFDO2lCQUNQO3FCQUNJLElBQUksRUFBRSxHQUFHLEVBQUU7b0JBQUUsR0FBRyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7cUJBQzVCO29CQUNILE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDN0IsS0FBSyxDQUFDLElBQUksQ0FBQzt3QkFDVCxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQzt3QkFDakIsS0FBSyxFQUFFLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTztxQkFDdEMsQ0FBQyxDQUFDO2lCQUNKO1NBQ0o7S0FDRjtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFyQ0Qsb0JBcUNDO0FBRUQsU0FBZ0IsS0FBSyxDQUFDLE1BQWlCO0lBQ3JDLE9BQU8sZUFBUTtTQUNaLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUNQLEVBQUUsQ0FBQyxLQUFLO1NBQ0wsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ1AsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQVcsQ0FBQyxDQUFDO1FBQzVDLElBQUksS0FBSyxFQUFFO1lBQ1QsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyxPQUFPLEtBQUssQ0FBQyxLQUFLLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztTQUNoRTs7WUFBTSxPQUFPLEdBQUcsQ0FBQztJQUNwQixDQUFDLENBQUM7U0FDRCxJQUFJLENBQUMsRUFBRSxDQUFDLENBQ1o7U0FDQSxJQUFJLENBQUMsR0FBRyxDQUFDO1NBQ1QsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBZkQsc0JBZUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwb3Mya2V5LCBpbnZSYW5rcyB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgKiBhcyBjZyBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGNvbnN0IGluaXRpYWw6IGNnLkZFTiA9ICc4LzgvOC84LzgvOC84LzgnO1xuXG5jb25zdCByb2xlczogeyBbbGV0dGVyOiBzdHJpbmddOiBjZy5Sb2xlIH0gPSB7XG4gIHA6ICdwYXduJyxcbiAgcjogJ3Jvb2snLFxuICBuOiAna25pZ2h0JyxcbiAgYjogJ2Jpc2hvcCcsXG4gIHE6ICdxdWVlbicsXG4gIGs6ICdraW5nJyxcbiAgZjogJ2ZsYXRzdG9uZScsXG4gIGM6ICdjYXBzdG9uZScsXG4gIHc6ICd3YWxsc3RvbmUnXG59O1xuXG5jb25zdCBsZXR0ZXJzID0ge1xuICBwYXduOiAncCcsXG4gIHJvb2s6ICdyJyxcbiAga25pZ2h0OiAnbicsXG4gIGJpc2hvcDogJ2InLFxuICBxdWVlbjogJ3EnLFxuICBraW5nOiAnaycsXG4gIHdhbGxzdG9uZTogJ3cnLFxuICBjYXBzdG9uZTogJ2MnLFxuICBmbGF0c3RvbmU6ICdmJ1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWQoZmVuOiBjZy5GRU4pOiBjZy5QaWVjZXMge1xuICBpZiAoZmVuID09PSAnc3RhcnQnKSBmZW4gPSBpbml0aWFsO1xuICBjb25zdCBwaWVjZXM6IGNnLlBpZWNlcyA9IG5ldyBNYXAoKTtcbiAgbGV0IHJvdyA9IDcsXG4gICAgICBjb2wgPSAwO1xuICBsZXQgc3RhY2s6IEFycmF5PGNnLlBpZWNlPiA9IFtdO1xuICBmb3IgKGNvbnN0IGMgb2YgZmVuKSB7XG4gICAgc3dpdGNoIChjKSB7XG4gICAgICBjYXNlICcgJzpcbiAgICAgICAgcmV0dXJuIHBpZWNlcztcbiAgICAgIGNhc2UgJy8nOlxuICAgICAgICAtLXJvdztcbiAgICAgICAgaWYgKHJvdyA8IDApIHJldHVybiBwaWVjZXM7XG4gICAgICAgIGNvbCA9IDA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc3QgbmIgPSBjLmNoYXJDb2RlQXQoMCk7XG4gICAgICAgIGlmIChuYiA9PSA0MCkge1xuICAgICAgICAgIHN0YWNrID0gW107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobmIgPT0gNDEpIHtcbiAgICAgICAgICBsZXQgcGllY2UgPSBzdGFja1swXTtcbiAgICAgICAgICBwaWVjZS5iZWxsb3cgPSBzdGFjay5zcGxpY2UoMSk7XG4gICAgICAgICAgcGllY2VzLnNldChwb3Mya2V5KFtjb2wsIHJvd10pLCBwaWVjZSk7IC8vIFRPRE86IGhhbmRsZSBzdGFja3NcbiAgICAgICAgICArK2NvbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChuYiA8IDU3KSBjb2wgKz0gbmIgLSA0ODtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29uc3Qgcm9sZSA9IGMudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBzdGFjay5wdXNoKHtcbiAgICAgICAgICAgIHJvbGU6IHJvbGVzW3JvbGVdLFxuICAgICAgICAgICAgY29sb3I6IGMgPT09IHJvbGUgPyAnYmxhY2snIDogJ3doaXRlJyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcGllY2VzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGUocGllY2VzOiBjZy5QaWVjZXMpOiBjZy5GRU4ge1xuICByZXR1cm4gaW52UmFua3NcbiAgICAubWFwKHkgPT5cbiAgICAgIGNnLmZpbGVzXG4gICAgICAgIC5tYXAoeCA9PiB7XG4gICAgICAgICAgY29uc3QgcGllY2UgPSBwaWVjZXMuZ2V0KCh4ICsgeSkgYXMgY2cuS2V5KTtcbiAgICAgICAgICBpZiAocGllY2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGxldHRlciA9IGxldHRlcnNbcGllY2Uucm9sZV07XG4gICAgICAgICAgICByZXR1cm4gcGllY2UuY29sb3IgPT09ICd3aGl0ZScgPyBsZXR0ZXIudG9VcHBlckNhc2UoKSA6IGxldHRlcjtcbiAgICAgICAgICB9IGVsc2UgcmV0dXJuICcxJztcbiAgICAgICAgfSlcbiAgICAgICAgLmpvaW4oJycpXG4gICAgKVxuICAgIC5qb2luKCcvJylcbiAgICAucmVwbGFjZSgvMXsyLH0vZywgcyA9PiBzLmxlbmd0aC50b1N0cmluZygpKTtcbn1cbiJdfQ==
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import decode from './bunzip.js';
import kmpSearch from './kmpSearch.js';
var currId = 0;
var decompressionTasks = new Map();
var decompressStream = function (params) {
    var id = currId++;
    var task = __assign(__assign({ id: id }, params), { chunks: [], header: Buffer.from([]), magic: new Uint8Array() });
    decompressionTasks.set(id, task);
    // TODO: Consider adding some queueing mechanism to avoid blocking the main thread
    // (setTimeout?)
    return {
        dataFinished: function () {
            processCompressedData(id, new Uint8Array(), true);
        },
        addData: function (data) {
            processCompressedData(id, data, false);
        },
        cancel: function () {
            decompressionTasks.delete(id);
        }
    };
};
var processCompressedData = function (id, data, isDone) {
    var _a, _b;
    var task = decompressionTasks.get(id);
    if (!task) {
        throw Error('No task');
    }
    try {
        var chunks = task.chunks;
        var header = task.header, magic = task.magic;
        var compressedData = void 0;
        if (isDone) {
            // If isDone is true, it means data is empty, just decompress what's left in the chunks
            compressedData = Buffer.concat(__spreadArray([header], chunks, true));
        }
        else {
            var newMagicIndex = -1;
            var isFirst = false;
            if (!header.length && data.byteLength > 0) {
                task.header = header = data.slice(0, 4);
                task.magic = magic = data.slice(4, 10);
                data = data.slice(4);
                isFirst = true;
            }
            // Find the magic number in the current block
            // If this is the first chunk, we skip the first byte to not match the magic number in the first block
            newMagicIndex = kmpSearch(data, magic, isFirst);
            if (newMagicIndex === -1 && chunks.length > 0) {
                // If we didn't find the magic number, try to combine the last chunk with the current one
                // This is to handle the case where the magic number is split between 2 blocks
                var magicLength = magic.length;
                var lastChunk = chunks[chunks.length - 1];
                // To optimize, we slice potentialMagicData to only contain (magicLength - 1) from each of its parts (the last chunk and the current one)
                // It will have a final size of (magicLength * 2 - 2)
                var potentialMagicData = new Uint8Array(__spreadArray(__spreadArray([], Array.from(lastChunk.slice(lastChunk.length - (magicLength - 1))), true), Array.from(data.slice(0, magicLength - 1)), true));
                newMagicIndex = kmpSearch(potentialMagicData, magic, false);
                if (newMagicIndex !== -1) {
                    // Concat the last chunk with the current one
                    var newValue = new Uint8Array(__spreadArray(__spreadArray([], Array.from(lastChunk), true), Array.from(data), true));
                    // Fix newMagicIndex to be relative to the beginning of lastChunk
                    newMagicIndex += lastChunk.length - (magicLength - 1);
                    // If we found the magic number, replace the last chunk with the new value
                    data = newValue;
                    chunks.pop();
                }
            }
            if (newMagicIndex === -1) {
                chunks.push(data);
                return;
            }
            var newBlockData = data.slice(0, newMagicIndex);
            compressedData = Buffer.concat(__spreadArray(__spreadArray([header], chunks, true), [newBlockData], false));
            var newNextBlockData = data.slice(newMagicIndex);
            task.chunks = [newNextBlockData];
        }
        var res = decode(compressedData, false);
        if (!res) {
            throw Error('Failed to decode');
        }
        // We get the callback in the last second in case the user cancels the task
        (_a = decompressionTasks.get(id)) === null || _a === void 0 ? void 0 : _a.onDecompressed(id, res.data, res.done);
    }
    catch (e) {
        var onError = (_b = decompressionTasks.get(id)) === null || _b === void 0 ? void 0 : _b.onError;
        if (!onError) {
            return;
        }
        var errStr = '';
        if (e instanceof Error) {
            errStr = e.message;
        }
        else {
            errStr = String(e);
        }
        onError(id, errStr);
    }
};
export default decompressStream;

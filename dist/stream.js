/* very simple input/output stream interface */
var Stream = /** @class */ (function () {
    function Stream() {
        var _this = this;
        // input streams //////////////
        /** Returns the next byte, or -1 for EOF. */
        this.readByte = function () {
            throw new Error('abstract method readByte() not implemented');
        };
        /** Attempts to fill the buffer; returns number of bytes read, or
         *  -1 for EOF. */
        this.read = function (buffer, bufOffset, length) {
            var bytesRead = 0;
            while (bytesRead < length) {
                var c = _this.readByte();
                if (c < 0) {
                    // EOF
                    return bytesRead === 0 ? -1 : bytesRead;
                }
                buffer[bufOffset++] = c;
                bytesRead++;
            }
            return bytesRead;
        };
        this.eof = function () {
            throw new Error('abstract method eof() not implemented');
        };
        // output streams ///////////
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.writeByte = function (_byte) {
            throw new Error('abstract method readByte() not implemented');
        };
        this.getBuffer = function () {
            throw new Error('abstract method getBuffer() not implemented');
        };
        this.pos = 0;
        this.buffer = new Uint8Array(0);
    }
    return Stream;
}());
export default Stream;

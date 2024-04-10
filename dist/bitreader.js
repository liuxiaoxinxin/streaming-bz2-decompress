var BITMASK = [0x00, 0x01, 0x03, 0x07, 0x0f, 0x1f, 0x3f, 0x7f, 0xff];
var BitReader = /** @class */ (function () {
    // offset in bytes
    function BitReader(stream) {
        var _this = this;
        this._ensureByte = function () {
            if (!_this.hasByte) {
                _this.curByte = _this.stream.readByte();
                _this.hasByte = true;
            }
        };
        // reads bits from the buffer
        this.read = function (bits) {
            var result = 0;
            while (bits > 0) {
                _this._ensureByte();
                var remaining = 8 - _this.bitOffset;
                // if we're in a byte
                if (bits >= remaining) {
                    result <<= remaining;
                    result |= BITMASK[remaining] & _this.curByte;
                    _this.hasByte = false;
                    _this.bitOffset = 0;
                    bits -= remaining;
                }
                else {
                    result <<= bits;
                    var shift = remaining - bits;
                    result |= (_this.curByte & (BITMASK[bits] << shift)) >> shift;
                    _this.bitOffset += bits;
                    bits = 0;
                }
            }
            return result;
        };
        // seek to an arbitrary point in the buffer (expressed in bits)
        // seek = (pos: number) => {
        //   const n_bit = pos % 8;
        //   const n_byte = (pos - n_bit) / 8;
        //   this.bitOffset = n_bit;
        //   this.stream.seek(n_byte);
        //   this.hasByte = false;
        // };
        // reads 6 bytes worth of data using the read method
        this.pi = function () {
            var buf = new Uint8Array(6);
            for (var i = 0; i < buf.length; i++) {
                buf[i] = _this.read(8);
            }
            return bufToHex(buf);
        };
        this.stream = stream;
        this.bitOffset = 0;
        this.curByte = 0;
        this.hasByte = false;
    }
    return BitReader;
}());
var bufToHex = function (buf) { return Array.prototype.map.call(buf, function (x) { return ('00' + x.toString(16)).slice(-2); }).join(''); };
export default BitReader;

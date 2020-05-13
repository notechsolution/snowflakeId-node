let bigInt = require('big-integer');
const debug = require('debug')('snowflakeid')
class SnowFlakeId {

    /**
     * Provider Constructor.
     * @param {Object} options
     * @param {Number} options.datacenter - Datacenter identifier. It can have values from 0 to 31 by default
     * @param {Number} options.worker - Worker identifier. It can have values from 0 to 31 by default.
     * @param {Number} options.epoch - Number used to reduce value of a generated timestamp.
     */
    constructor(options = {}) {
        this.options = options;
        this.bits = {
            sequence: this.options.sequenceBit || 12,
            worker: this.options.workerBit || 5,
            dataCenter: this.options.dataCenterBit || 5
        };

        this.offsets = {
            worker: this.bits.sequence,
            dataCenter: this.bits.sequence + this.bits.worker,
            timestamp: this.bits.sequence + this.bits.worker + this.bits.dataCenter
        };

        this.dataCenter = this.options.dataCenter || 0;
        this.worker = this.options.worker || 0;
        this.epoch = this.options.epoch || new Date(2000, 0, 1).getTime();
        this.fixedSubId = this.dataCenter << this.offsets.dataCenter | this.worker << this.offsets.worker;
        this.seq = 0;
        this.seqMask = Math.pow(2, this.bits.sequence) - 1;
        this.lastTime = 0;
        if (this.dataCenter > Math.pow(2, this.bits.dataCenter) - 1 || this.worker > Math.pow(2, this.bits.worker) - 1) {
            throw new Error(`[SnowFlake]Provided dataCenter-${this.dataCenter}/worker-${this.worker} is exceed the limitation of bits: ${JSON.stringify(this.bits)}`);
        }
        debug(`[SnowFlakeId] Generator is ready with bits config :${JSON.stringify(this.bits)} ,and offsets config: ${JSON.stringify(this.offsets)}`)
    }

    next() {
        const start = new Date();
        let time = bigInt(Date.now() - this.epoch);
        if (time < this.lastTime) {
            throw new Error(`Strange case found. Clock moved backwards. Refusing to generate id for ${this.lastTime - time} milliseconds`);
        }
        if (time === this.lastTime) {
            this.seq = this.seq + 1;
        } else {
            this.seq = 0;
        }
        this.lastTime = time;
        const genId = time.shiftLeft(this.offsets.timestamp)
            .or(this.fixedSubId)
            .or(this.seq);
        debug(`[SnowFlakeId] gen ${genId.bitLength()} bits Id time cost: ${new Date() - start}`);
        return genId;
    }

    parse(uid) {
        let id;
        if (bigInt.isInstance(uid)) {
            id = uid;
        } else {
            id = bigInt(uid);
        }
        const bitArray = id.toArray(2).value;
        const bitLength = bitArray.length;
        const sequence = this._getDecimal(bitArray, bitLength - this.bits.sequence, this.bits.sequence);
        const worker = this._getDecimal(bitArray, bitLength - this.offsets.dataCenter, this.bits.worker);
        const dataCenter = this._getDecimal(bitArray, bitLength - this.offsets.timestamp, this.bits.dataCenter);
        const timestamp = this._getDecimal(bitArray, 0, bitLength - this.offsets.timestamp);

        return { timestamp: new Date(timestamp + this.epoch), dataCenter, worker, sequence };
    }

    _getDecimal(bitArray, from, numberOfBits) {
        const bits = bitArray.slice(from, from + numberOfBits);
        return parseInt(bits.join(''), 2);
    }

}
module.exports = SnowFlakeId;

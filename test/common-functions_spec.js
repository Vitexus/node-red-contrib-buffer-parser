/// <reference types="should" />
require('should')
const commonFunctions = require('.././common-functions.js')

describe('common-functions.js', function () {
    it('should be loaded', done => {
        function shouldHaveFunction (obj, fName) {
            obj.should.have.property(fName).which.is.a.Function()
        }
        try {
            commonFunctions.should.be.type('object')
            commonFunctions.should.have.property('SWAPOPTS').which.is.instanceOf(Array)
            commonFunctions.should.have.property('TYPEOPTS').which.is.instanceOf(Array)

            shouldHaveFunction(commonFunctions, 'bcd2number')// additional tests TO DO
            shouldHaveFunction(commonFunctions, 'number2bcd')// additional tests TO DO
            shouldHaveFunction(commonFunctions, 'byteToBits')
            shouldHaveFunction(commonFunctions, 'wordToBits')
            shouldHaveFunction(commonFunctions, 'bitsToByte')
            shouldHaveFunction(commonFunctions, 'bitsToWord')
            shouldHaveFunction(commonFunctions, 'getBit')// additional tests TO DO
            shouldHaveFunction(commonFunctions, 'setBit')// additional tests TO DO
            shouldHaveFunction(commonFunctions, 'clearBit')// additional tests TO DO
            shouldHaveFunction(commonFunctions, 'updateBit')// additional tests TO DO
            shouldHaveFunction(commonFunctions, 'isNumber')
            shouldHaveFunction(commonFunctions, 'setObjectProperty')
            shouldHaveFunction(commonFunctions, 'getObjectProperty')
            shouldHaveFunction(commonFunctions, 'asyncEvaluateNodeProperty')
            shouldHaveFunction(commonFunctions, 'byteLengthOfUTF8')

            done() // success :)
        } catch (error) {
            done(error)
        }
    })

    const parent = {}
    const grandchildNamePath = 'child.child.name'
    const grandchildName = 'dum dum'

    describe('#setObjectProperty()', () => {
        it('should set object property by path', done => {
            try {
                commonFunctions.setObjectProperty(parent, 'child.child.name', grandchildName)
                parent.should.have.propertyByPath(...grandchildNamePath.split('.')).which.eqls(grandchildName)
                done()
            } catch (error) {
                done(error)
            }
        })
    })

    describe('#getObjectProperty()', () => {
        it('should get object property by path', done => {
            try {
                const name = commonFunctions.getObjectProperty(parent, grandchildNamePath) || ''
                name.should.eql(grandchildName)
                done()
            } catch (error) {
                done(error)
            }
        })
    })

    describe('#isNumber()', () => {
        it('should test numbers', done => {
            try {
                commonFunctions.isNumber('123').should.eql(true)
                commonFunctions.isNumber('0x123').should.eql(true)
                commonFunctions.isNumber('0b1001').should.eql(true)
                commonFunctions.isNumber('0o1234567').should.eql(true)
                commonFunctions.isNumber('0o12345678').should.eql(false)
                commonFunctions.isNumber('efg').should.eql(false)
                commonFunctions.isNumber(null).should.eql(false)
                done()
            } catch (error) {
                done(error)
            }
        })
    })

    describe('#byteToBits() #bitsToByte()', () => {
        it('should convert byte to bits and back to byte', done => {
            try {
                const x96 = commonFunctions.byteToBits(0x96)
                x96.bits.should.eql([0, 1, 1, 0, 1, 0, 0, 1]) // bit 0 ~ 7
                commonFunctions.bitsToByte(x96.bits).should.eql(0x96)
                done()
            } catch (error) {
                done(error)
            }
        })
    })

    describe('#wordToBits() #bitsToWord()', () => {
        it('should convert word to bits and back to word', done => {
            try {
                const xf708 = commonFunctions.wordToBits(0xf708) //
                xf708.bits.should.eql([0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1]) // bit 0 ~ 15
                commonFunctions.bitsToWord(xf708.bits).should.eql(0xf708)
                done()
            } catch (error) {
                done(error)
            }
        })
    })

    describe('#byteLengthOfUTF8()', () => {
        it('should return the byte length of a UTF-8 string', async () => {
            const length = commonFunctions.byteLengthOfUTF8('Hello, 世界')
            length.should.eql(13)
        })
    })

    describe('getBit()', () => {
        it('should get a bit from a byte', async () => {
            const x00 = 0x0
            const xFF = 0xFF
            commonFunctions.getBit(x00, 0).should.eql(0)
            commonFunctions.getBit(x00, 1).should.eql(0)
            commonFunctions.getBit(x00, 2).should.eql(0)
            commonFunctions.getBit(x00, 3).should.eql(0)
            commonFunctions.getBit(x00, 4).should.eql(0)
            commonFunctions.getBit(x00, 5).should.eql(0)
            commonFunctions.getBit(x00, 6).should.eql(0)
            commonFunctions.getBit(x00, 7).should.eql(0)
            commonFunctions.getBit(xFF, 0).should.eql(1)
            commonFunctions.getBit(xFF, 1).should.eql(1)
            commonFunctions.getBit(xFF, 2).should.eql(1)
            commonFunctions.getBit(xFF, 3).should.eql(1)
            commonFunctions.getBit(xFF, 4).should.eql(1)
            commonFunctions.getBit(xFF, 5).should.eql(1)
            commonFunctions.getBit(xFF, 6).should.eql(1)
            commonFunctions.getBit(xFF, 7).should.eql(1)
            commonFunctions.getBit(0xFFFF, 15).should.eql(1)
            commonFunctions.getBit(0x7FFF, 15).should.eql(0)
        })
    })

    describe('setBit()', () => {
        it('should set a bit in a byte', async () => {
            const x00 = 0x0
            commonFunctions.setBit(x00, 0).should.eql(0x01) // 0x01 = 00000001
            commonFunctions.setBit(x00, 1).should.eql(0x02) // 0x02 = 00000010
            commonFunctions.setBit(x00, 2).should.eql(0x04) // 0x04 = 00000100
            commonFunctions.setBit(x00, 3).should.eql(0x08) // 0x08 = 00001000
            commonFunctions.setBit(x00, 4).should.eql(0x10) // 0x10 = 00010000
            commonFunctions.setBit(x00, 5).should.eql(0x20) // 0x20 = 00100000
            commonFunctions.setBit(x00, 6).should.eql(0x40) // 0x40 = 01000000
            commonFunctions.setBit(x00, 7).should.eql(0x80) // 0x80 = 10000000
            commonFunctions.setBit(x00, 15).should.eql(0x8000) // 0x8000 = 1000000000000000
        })
    })

    describe('clearBit()', () => {
        it('should clear a bit in a byte', async () => {
            const xFF = 0xFF
            commonFunctions.clearBit(xFF, 0).should.eql(0xFE) // 0xFE = 11111110
            commonFunctions.clearBit(xFF, 1).should.eql(0xFD) // 0xFD = 11111101
            commonFunctions.clearBit(xFF, 2).should.eql(0xFB) // 0xFB = 11111011
            commonFunctions.clearBit(xFF, 3).should.eql(0xF7) // 0xF7 = 11110111
            commonFunctions.clearBit(xFF, 4).should.eql(0xEF) // 0xEF = 11101111
            commonFunctions.clearBit(xFF, 5).should.eql(0xDF) // 0xDF = 11011111
            commonFunctions.clearBit(xFF, 6).should.eql(0xBF) // 0xBF = 10111111
            commonFunctions.clearBit(xFF, 7).should.eql(0x7F) // 0x7F = 01111111
            commonFunctions.clearBit(0xFFFF, 15).should.eql(0x7FFF) // 0x7FFF = 0111111111111111
        })
    })

    describe('updateBit()', () => {
        it('should update a bit', async () => {
            const xF00F = 0xF00F
            commonFunctions.updateBit(xF00F, 0, 1).should.eql(0xF00F) // 0xF00E = 1111000000001111 // no change
            commonFunctions.updateBit(xF00F, 0, 15).should.eql(0xF00F) // 0xF00E = 1111000000001111 // no change
            commonFunctions.updateBit(xF00F, 0, 0).should.eql(0xF00E) // 0xF00E = 1111000000001110
            commonFunctions.updateBit(xF00F, 1, 0).should.eql(0xF00D) // 0xF00D = 1111000000001101
            commonFunctions.updateBit(xF00F, 4, 1).should.eql(0xF01F) // 0xF01F = 1111000000011111
            commonFunctions.updateBit(xF00F, 11, 1).should.eql(0xF80F) // 0xF80F = 1111100000001111
        })
    })
})

const should = require('should')
const helper = require('node-red-node-test-helper')
const bufferParser = require('../buffer-parser.js')

const getTestFlow = (id, nodeName, resultPayloadPropName, items, options) => {
    options = options || {}
    options.resultType = options.resultType || 'keyvalue'
    options.resultTypeType = options.resultTypeType || 'return'
    options.msgPropertyType = options.msgPropertyType || 'str'
    options.setTopic = options.setTopic ?? true
    options.multipleResult = options.multipleResult || false
    options.fanOutMultipleResult = options.fanOutMultipleResult || false
    id = id || 'testNode'
    nodeName = nodeName || id
    resultPayloadPropName = resultPayloadPropName || 'payload'
    items = items || [
        { type: 'int16be', name: 'item1', offset: 0, length: 1, offsetbit: 0, scale: '1', mask: '' },
        { type: 'int32be', name: 'item2', offset: 2, length: 1, offsetbit: 0, scale: '1', mask: '' },
        { type: 'bigint64be', name: 'item3', offset: 6, length: 1, offsetbit: 0, scale: '1', mask: '' },
        { type: 'hex', name: 'item4', offset: 14, length: 10, offsetbit: 0, scale: '1', mask: '' },
        { type: 'string', name: 'item5', offset: 24, length: 10, offsetbit: 0, scale: '1', mask: '' }
    ]
    let helpers = [{ id: 'helperNode1', type: 'helper' }]
    if (options.fanOutMultipleResult) {
        helpers = items.map((item, index) => {
            return { id: `helperNode${index + 1}`, type: 'helper' }
        })
    }
    const helperWires = helpers.map((helper, index) => {
        return [helper.id]
    })
    return [
        ...helpers,
        { id: 'catchHelper', type: 'helper' },
        { id: 'completeHelper', type: 'helper' },
        {
            id,
            type: 'buffer-parser',
            name: nodeName,
            data: 'payload',
            dataType: 'msg',
            specification: 'spec',
            specificationType: 'ui',
            items,
            swap1: '',
            swap2: '',
            swap3: '',
            swap1Type: 'swap',
            swap2Type: 'swap',
            swap3Type: 'swap',
            msgProperty: resultPayloadPropName,
            msgPropertyType: options.msgPropertyType,
            resultType: options.resultType,
            resultTypeType: options.resultTypeType,
            multipleResult: options.multipleResult,
            fanOutMultipleResult: options.fanOutMultipleResult,
            setTopic: options.setTopic,
            outputs: helpers.length,
            wires: helperWires
        },
        { id: 'catchNode1', type: 'catch', name: '', scope: [id], uncaught: false, wires: [['catchHelper']] },
        { id: 'completeNode1', type: 'complete', name: '', scope: [id], wires: [['completeHelper']] }

    ]
}

helper.init(require.resolve('node-red'))

describe('buffer-parser Node', function () {
    'use strict'

    beforeEach(done => { helper.startServer(done) })

    afterEach(done => { helper.unload().then(() => helper.stopServer(done)) })

    it('should be loaded', done => {
        const flow = getTestFlow('testNode', 'testNode1', 'payload', [
            { name: 'item1', type: 'byte', length: 1, dataType: 'num', data: '1' },
            { name: 'item2', type: 'int8', length: 1, dataType: 'num', data: '-2' },
            { name: 'item3', type: 'uint8', length: 1, dataType: 'num', data: '3' },
            { name: 'item4', type: 'int16le', length: 1, dataType: 'num', data: '-4' },
            { name: 'item5', type: 'uint16le', length: 1, dataType: 'num', data: '5' },
            { name: 'item6', type: 'uint16le', length: 1, dataType: 'num', data: '6' }
        ])
        // const flow = [{ id: 'testNode', type: 'buffer-parser', name: 'test--buffer-parser', specification: 'spec', specificationType: 'ui', items: [{ name: 'item1', type: 'byte', length: 1, dataType: 'num', data: '1' },
        // { name: 'item2', type: 'int8', length: 1, dataType: 'num', data: '-2' }, { name: 'item3', type: 'uint8', length: 1, dataType: 'num', data: '3' }, { name: 'item4', type: 'int16le', length: 1, dataType: 'num', data: '-4' }, { name: 'item5', type: 'uint16le', length: 1, dataType: 'num', data: '5' }, { name: 'item6', type: 'uint16le', length: 1, dataType: 'num', data: '6' }], swap1: '', swap2: '', swap3: '', swap1Type: 'swap', swap2Type: 'swap', swap3Type: 'swap', msgProperty: 'payload', msgPropertyType: 'str' }]
        helper.load(bufferParser, flow, () => {
            try {
                const testNode = helper.getNode('testNode')
                testNode.should.have.property('name', 'testNode1')
                done()
            } catch (error) {
                done(error)
            }
        })
    })

    it('should make BigInt values with and without mask', async () => {
        const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
            { type: 'bigint64be', name: 'MASK_00000001FFFFFFFF', offset: 0, length: 1, offsetbit: 0, scale: '1', mask: '0x00000001FFFFFFFF' },
            { type: 'bigint64be', name: 'MASK_000001FFFFFFFFFF', offset: 0, length: 1, offsetbit: 0, scale: '1', mask: '0x000001FFFFFFFFFF' },
            { type: 'bigint64be', name: 'MASK_0001FFFFFFFFFFFF', offset: 0, length: 1, offsetbit: 0, scale: '1', mask: '0x0001FFFFFFFFFFFF' },
            { type: 'bigint64be', name: 'MASK_000FFFFFFFFFFFFF', offset: 0, length: 1, offsetbit: 0, scale: '1', mask: '0x000FFFFFFFFFFFFF' },
            { type: 'bigint64be', name: 'NO_MASK', offset: 0, length: 1, offsetbit: 0, scale: '1', mask: '' }
        ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
        await helper.load(bufferParser, flow)
        const testNode = helper.getNode('testNode')
        const helperNode1 = helper.getNode('helperNode1')
        const resultsPromise = new Promise((resolve) => {
            helperNode1.on('input', function (msg) {
                resolve(msg)
            })
        })
        testNode.receive({ payload: Buffer.from([0, 15, 255, 255, 255, 255, 255, 255]) }) // fire input of testNode with a buffer of 0x000FFFFFFFFFFFFF (4503599627370495)
        const msg = await resultsPromise
        msg.should.have.property('payload')
        msg.payload.should.be.an.Object()
        msg.payload.should.have.property('MASK_00000001FFFFFFFF')
        msg.payload.should.have.property('MASK_000001FFFFFFFFFF')
        msg.payload.should.have.property('MASK_0001FFFFFFFFFFFF')
        msg.payload.should.have.property('MASK_000FFFFFFFFFFFFF')
        msg.payload.should.have.property('NO_MASK')
        msg.payload.MASK_00000001FFFFFFFF.should.eql(8589934591n)
        msg.payload.MASK_000001FFFFFFFFFF.should.eql(2199023255551n)
        msg.payload.MASK_0001FFFFFFFFFFFF.should.eql(562949953421311n)
        msg.payload.MASK_000FFFFFFFFFFFFF.should.eql(4503599627370495n)
        msg.payload.NO_MASK.should.eql(4503599627370495n)
    })

    it('should generate 5 values (fan out test)', async () => {
        const resultProp = 'my.custom.payload'
        const testNodeId = 'testNode'
        const testNodeName = 'buffer-parser-node-name'
        const flow = getTestFlow(testNodeId, testNodeName, resultProp, null, {
            resultType: 'keyvalue',
            resultTypeType: 'return',
            msgPropertyType: 'str',
            multipleResult: true,
            fanOutMultipleResult: true,
            setTopic: true
        })

        await helper.load(bufferParser, flow)
        const helperNode1 = helper.getNode('helperNode1')
        const helperNode2 = helper.getNode('helperNode2')
        const helperNode3 = helper.getNode('helperNode3')
        const helperNode4 = helper.getNode('helperNode4')
        const helperNode5 = helper.getNode('helperNode5')
        const testNode = helper.getNode(testNodeId)

        should(helperNode1).not.be.null()
        should(helperNode2).not.be.null()
        should(helperNode3).not.be.null()
        should(helperNode4).not.be.null()
        should(helperNode5).not.be.null()
        should(testNode).not.be.null()
        testNode.should.have.property('name', testNodeName)

        const messages = {}
        const resultsPromise = new Promise((resolve) => {
            let msgCounter = 0
            const storeMsg = function (msg, index) {
                messages[`resultMsg${index}`] = msg
                msgCounter++
                if (msgCounter === 5) {
                    resolve(messages)
                }
            }
            helperNode1.on('input', function (msg) {
                storeMsg(msg, 1)
            })
            helperNode2.on('input', function (msg) {
                storeMsg(msg, 2)
            })
            helperNode3.on('input', function (msg) {
                storeMsg(msg, 3)
            })
            helperNode4.on('input', function (msg) {
                storeMsg(msg, 4)
            })
            helperNode5.on('input', function (msg) {
                storeMsg(msg, 5)
            })
        })
        testNode.receive({ payload: Buffer.from([97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90]) }) // fire input of testNode
        const results = await resultsPromise
        results.should.have.properties(['resultMsg1', 'resultMsg2', 'resultMsg3', 'resultMsg4', 'resultMsg5'])
        const doTest = function (msg, expectedType, expectedValue, expectedTopic) {
            const path = resultProp.split('.')
            msg.topic.should.eql(expectedTopic) // topic should be set to expectedTopic
            msg.should.have.propertyByPath(...path)
            /** @type {should.Assertion} */ const rp = msg.should.have.propertyByPath(...path).obj// get the nested property
            should(rp).be.of.type(expectedType)
            should(rp).eql(expectedValue)
        }
        doTest(results.resultMsg1, 'number', 24930, 'item1')
        doTest(results.resultMsg2, 'number', 1667523942, 'item2')
        doTest(results.resultMsg3, 'bigint', 7451321489274203502n, 'item3')
        doTest(results.resultMsg4, 'string', '6f707172737475767778', 'item4')
        doTest(results.resultMsg5, 'string', 'yzABCDEFGH', 'item5')
    })
    describe('scale values', () => {
        function shouldHaveItemValues (data, itemNames, expectedValues) {
            should.exist(data, 'payload should exist')
            data.should.be.an.Object()
            data.should.have.properties(itemNames)
            itemNames.forEach((itemName, index) => {
                data.should.have.property(itemName)
                data[itemName].should.eql(expectedValues[index], `${itemName} should have value ${expectedValues[index]}`)
            })
        }
        /** @type {import('node-red').Node} */ let testNode = null
        /** @type {import('node-red').Node} */ let helperNode1 = null
        /** @type {import('node-red').Node} */ let catchHelper = null
        // eslint-disable-next-line no-unused-vars
        /** @type {import('node-red').Node} */ let completeHelper = null
        async function load (flow) {
            await helper.load(bufferParser, flow)
            testNode = helper.getNode('testNode')
            helperNode1 = helper.getNode('helperNode1')
            catchHelper = helper.getNode('catchHelper')
            completeHelper = helper.getNode('completeHelper')
        }

        it('should minus values', async () => {
            const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
                { type: 'int8', offset: 1, length: 1, offsetbit: 0, scale: '- 2.5', mask: '' },
                { type: 'uint16be', offset: 0, length: 1, offsetbit: 0, scale: '-2.5', mask: '' },
                { type: 'uint16le', offset: 0, length: 1, offsetbit: 0, scale: '-2.5', mask: '' },
                { type: 'int32be', offset: 0, length: 1, offsetbit: 0, scale: '-2.5', mask: '' },
                { type: 'int32le', offset: 0, length: 1, offsetbit: 0, scale: '-2.5', mask: '' }
            ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
            const itemNames = flow.find(n => n.id === 'testNode').items.map((item, index) => item.name || `item${index + 1}`)
            await load(flow)
            const resultsPromise = new Promise((resolve, reject) => {
                catchHelper.on('input', function (msg) {
                    reject(new Error('Error caught: ' + msg.error.message))
                })
                helperNode1.on('input', function (msg) {
                    resolve(msg)
                })
            })
            testNode.receive({ payload: Buffer.from([0, 15, 10, 25]) })
            const msg = await resultsPromise
            shouldHaveItemValues(msg.payload, itemNames, [12.5, 12.5, 3837.5, 985622.5, 420089597.5])
        })
        it('should add values', async () => {
            const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
                { type: 'int16be', offset: 0, length: 1, offsetbit: 0, scale: '+ 2.5', mask: '' },
                { type: 'uint16be', offset: 0, length: 1, offsetbit: 0, scale: '+ 2.5', mask: '' },
                { type: 'int8', offset: 0, length: 1, offsetbit: 0, scale: '+ 2.5', mask: '' },
                { type: 'uint8', offset: 0, length: 1, offsetbit: 0, scale: '+ 2.5', mask: '' },
                { type: 'int32be', offset: 0, length: 1, offsetbit: 0, scale: '+ 2.5', mask: '' },
                { type: 'int32le', offset: 0, length: 1, offsetbit: 0, scale: '+ 2.5', mask: '' }
            ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
            const itemNames = flow.find(n => n.id === 'testNode').items.map((item, index) => item.name || `item${index + 1}`)
            await load(flow)
            const resultsPromise = new Promise((resolve, reject) => {
                catchHelper.on('input', function (msg) {
                    reject(new Error('Error caught: ' + msg.error.message))
                })
                helperNode1.on('input', function (msg) {
                    resolve(msg)
                })
            })
            testNode.receive({ payload: Buffer.from([0, 15, 10, 25]) })
            const msg = await resultsPromise
            shouldHaveItemValues(msg.payload, itemNames, [17.5, 17.5, 2.5, 2.5, 985627.5, 420089602.5])
        })
        it('should multiply values', async () => {
            const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
                { type: 'int16be', offset: 0, length: 1, offsetbit: 0, scale: '* 2.5', mask: '' },
                { type: 'int16le', offset: 0, length: 1, offsetbit: 0, scale: '* 2.5', mask: '' },
                { type: 'int8', offset: 1, length: 1, offsetbit: 0, scale: '* 2.5', mask: '' },
                { type: 'uint8', offset: 1, length: 1, offsetbit: 0, scale: '* 2.5', mask: '' },
                { type: 'int32be', offset: 0, length: 1, offsetbit: 0, scale: '* 2.5', mask: '' },
                { type: 'int32le', offset: 0, length: 1, offsetbit: 0, scale: '* 2.5', mask: '' }
            ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
            const itemNames = flow.find(n => n.id === 'testNode').items.map((item, index) => item.name || `item${index + 1}`)
            await load(flow)
            const resultsPromise = new Promise((resolve, reject) => {
                catchHelper.on('input', function (msg) {
                    reject(new Error('Error caught: ' + msg.error.message))
                })
                helperNode1.on('input', function (msg) {
                    resolve(msg)
                })
            })
            const testData = Buffer.from([0, 0, 0, 0])
            testData.writeInt16BE(10, 0) // 16BE 10, 16LE 2560, 32BE 660480, 32LE 1313280
            testData.writeInt16LE(20, 2)
            testNode.receive({ payload: testData })
            const msg = await resultsPromise
            shouldHaveItemValues(msg.payload, itemNames, [10 * 2.5, 2560 * 2.5, 10 * 2.5, 10 * 2.5, 660480 * 2.5, 1313280 * 2.5])
        })
        it('should divide values', async () => {
            const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
                { type: 'int16be', offset: 0, length: 1, offsetbit: 0, scale: '/ 2.5', mask: '' },
                { type: 'int16le', offset: 0, length: 1, offsetbit: 0, scale: '/ 2.5', mask: '' },
                { type: 'int8', offset: 1, length: 1, offsetbit: 0, scale: '/ 2.5', mask: '' },
                { type: 'uint8', offset: 1, length: 1, offsetbit: 0, scale: '/ 2.5', mask: '' },
                { type: 'int32be', offset: 0, length: 1, offsetbit: 0, scale: '/ 2.5', mask: '' },
                { type: 'int32le', offset: 0, length: 1, offsetbit: 0, scale: '/ 2.5', mask: '' }
            ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
            const itemNames = flow.find(n => n.id === 'testNode').items.map((item, index) => item.name || `item${index + 1}`)
            await load(flow)
            const resultsPromise = new Promise((resolve, reject) => {
                catchHelper.on('input', function (msg) {
                    reject(new Error('Error caught: ' + msg.error.message))
                })
                helperNode1.on('input', function (msg) {
                    resolve(msg)
                })
            })
            const testData = Buffer.from([0, 0, 0, 0])
            testData.writeInt16BE(10, 0) // 16BE 10, 16LE 2560, 32BE 660480, 32LE 1313280
            testData.writeInt16LE(20, 2)
            testNode.receive({ payload: testData })
            const msg = await resultsPromise
            shouldHaveItemValues(msg.payload, itemNames, [10 / 2.5, 2560 / 2.5, 10 / 2.5, 10 / 2.5, 660480 / 2.5, 1313280 / 2.5])
        })
        it('should scale values >> shift', async () => {
            const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
                { type: 'int16be', offset: 0, length: 1, offsetbit: 0, scale: '>> 2', mask: '' },
                { type: 'int16le', offset: 0, length: 1, offsetbit: 0, scale: '>> 2', mask: '' },
                { type: 'int8', offset: 1, length: 1, offsetbit: 0, scale: '>> 2', mask: '' },
                { type: 'uint8', offset: 1, length: 1, offsetbit: 0, scale: '>> 2', mask: '' },
                { type: 'int32be', offset: 0, length: 1, offsetbit: 0, scale: '>> 2', mask: '' },
                { type: 'int32le', offset: 0, length: 1, offsetbit: 0, scale: '>> 2', mask: '' }
            ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
            const itemNames = flow.find(n => n.id === 'testNode').items.map((item, index) => item.name || `item${index + 1}`)
            await load(flow)
            const resultsPromise = new Promise((resolve, reject) => {
                catchHelper.on('input', function (msg) {
                    reject(new Error('Error caught: ' + msg.error.message))
                })
                helperNode1.on('input', function (msg) {
                    resolve(msg)
                })
            })
            const testData = Buffer.from([0, 0, 0, 0])
            testData.writeInt16BE(10, 0) // 16BE 10, 16LE 2560, 32BE 660480, 32LE 1313280
            testData.writeInt16LE(20, 2)
            testNode.receive({ payload: testData })
            const msg = await resultsPromise
            shouldHaveItemValues(msg.payload, itemNames, [
                10 >> 2,
                2560 >> 2,
                10 >> 2,
                10 >> 2,
                660480 >> 2,
                1313280 >> 2
            ])
        })
        it('should scale values << shift', async () => {
            const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
                { type: 'int16be', offset: 0, length: 1, offsetbit: 0, scale: '<< 2', mask: '' },
                { type: 'int16le', offset: 0, length: 1, offsetbit: 0, scale: '<< 2', mask: '' },
                { type: 'int8', offset: 1, length: 1, offsetbit: 0, scale: '<< 2', mask: '' },
                { type: 'uint8', offset: 1, length: 1, offsetbit: 0, scale: '<< 2', mask: '' },
                { type: 'int32be', offset: 0, length: 1, offsetbit: 0, scale: '<< 2', mask: '' },
                { type: 'int32le', offset: 0, length: 1, offsetbit: 0, scale: '<< 2', mask: '' }
            ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
            const itemNames = flow.find(n => n.id === 'testNode').items.map((item, index) => item.name || `item${index + 1}`)
            await load(flow)
            const resultsPromise = new Promise((resolve, reject) => {
                catchHelper.on('input', function (msg) {
                    reject(new Error('Error caught: ' + msg.error.message))
                })
                helperNode1.on('input', function (msg) {
                    resolve(msg)
                })
            })
            const testData = Buffer.from([0, 0, 0, 0])
            testData.writeInt16BE(10, 0) // 16BE 10, 16LE 2560, 32BE 660480, 32LE 1313280
            testData.writeInt16LE(20, 2)
            testNode.receive({ payload: testData })
            const msg = await resultsPromise
            shouldHaveItemValues(msg.payload, itemNames, [
                10 << 2,
                2560 << 2,
                10 << 2,
                10 << 2,
                660480 << 2,
                1313280 << 2
            ])
        })
        it('should scale values >>> shift', async () => {
            const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
                { type: 'int16be', offset: 0, length: 1, offsetbit: 0, scale: '>>> 2', mask: '' },
                { type: 'int16le', offset: 0, length: 1, offsetbit: 0, scale: '>>> 2', mask: '' },
                { type: 'int8', offset: 1, length: 1, offsetbit: 0, scale: '>>> 2', mask: '' },
                { type: 'uint8', offset: 1, length: 1, offsetbit: 0, scale: '>>> 2', mask: '' },
                { type: 'int32be', offset: 0, length: 1, offsetbit: 0, scale: '>>> 2', mask: '' },
                { type: 'int32le', offset: 0, length: 1, offsetbit: 0, scale: '>>> 2', mask: '' }
            ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
            const itemNames = flow.find(n => n.id === 'testNode').items.map((item, index) => item.name || `item${index + 1}`)
            await load(flow)
            const resultsPromise = new Promise((resolve, reject) => {
                catchHelper.on('input', function (msg) {
                    reject(new Error('Error caught: ' + msg.error.message))
                })
                helperNode1.on('input', function (msg) {
                    resolve(msg)
                })
            })
            const testData = Buffer.from([0, 0, 0, 0])
            testData.writeInt16BE(10, 0) // 16BE 10, 16LE 2560, 32BE 660480, 32LE 1313280
            testData.writeInt16LE(20, 2)
            testNode.receive({ payload: testData })
            const msg = await resultsPromise
            shouldHaveItemValues(msg.payload, itemNames, [
                (10 >>> 2),
                (2560 >>> 2),
                (10 >>> 2),
                (10 >>> 2),
                (660480 >>> 2),
                (1313280 >>> 2)
            ])
        })

        it('should scale values ** raise to power', async () => {
            const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
                { type: 'int16be', offset: 0, length: 1, offsetbit: 0, scale: '** 2', mask: '' },
                { type: 'int16le', offset: 0, length: 1, offsetbit: 0, scale: '** 2', mask: '' },
                { type: 'int8', offset: 1, length: 1, offsetbit: 0, scale: '** 2', mask: '' },
                { type: 'uint8', offset: 1, length: 1, offsetbit: 0, scale: '** 2', mask: '' },
                { type: 'int32be', offset: 0, length: 1, offsetbit: 0, scale: '** 2', mask: '' },
                { type: 'int32le', offset: 0, length: 1, offsetbit: 0, scale: '** 2', mask: '' }
            ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
            const itemNames = flow.find(n => n.id === 'testNode').items.map((item, index) => item.name || `item${index + 1}`)
            await load(flow)
            const resultsPromise = new Promise((resolve, reject) => {
                catchHelper.on('input', function (msg) {
                    reject(new Error('Error caught: ' + msg.error.message))
                })
                helperNode1.on('input', function (msg) {
                    resolve(msg)
                })
            })
            const testData = Buffer.from([0, 0, 0, 0])
            testData.writeInt16BE(10, 0) // 16BE 10, 16LE 2560, 32BE 660480, 32LE 1313280
            testData.writeInt16LE(20, 2)
            testNode.receive({ payload: testData })
            const msg = await resultsPromise
            shouldHaveItemValues(msg.payload, itemNames, [
                Math.pow(10, 2),
                Math.pow(2560, 2),
                Math.pow(10, 2),
                Math.pow(10, 2),
                Math.pow(660480, 2),
                Math.pow(1313280, 2)
            ])
        })
        it('should scale values ^ XOR', async () => {
            const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
                { type: 'int16be', offset: 0, length: 1, offsetbit: 0, scale: '^ 2', mask: '' },
                { type: 'int16le', offset: 0, length: 1, offsetbit: 0, scale: '^ 2', mask: '' },
                { type: 'int8', offset: 1, length: 1, offsetbit: 0, scale: '^ 2', mask: '' },
                { type: 'uint8', offset: 1, length: 1, offsetbit: 0, scale: '^ 2', mask: '' },
                { type: 'int32be', offset: 0, length: 1, offsetbit: 0, scale: '^ 2', mask: '' },
                { type: 'int32le', offset: 0, length: 1, offsetbit: 0, scale: '^ 2', mask: '' }
            ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
            const itemNames = flow.find(n => n.id === 'testNode').items.map((item, index) => item.name || `item${index + 1}`)
            await load(flow)
            const resultsPromise = new Promise((resolve, reject) => {
                catchHelper.on('input', function (msg) {
                    reject(new Error('Error caught: ' + msg.error.message))
                })
                helperNode1.on('input', function (msg) {
                    resolve(msg)
                })
            })
            const testData = Buffer.from([0, 0, 0, 0])
            testData.writeInt16BE(10, 0) // 16BE 10, 16LE 2560, 32BE 660480, 32LE 1313280
            testData.writeInt16LE(20, 2)
            testNode.receive({ payload: testData })
            const msg = await resultsPromise
            shouldHaveItemValues(msg.payload, itemNames, [
                (10 ^ 2),
                (2560 ^ 2),
                (10 ^ 2),
                (10 ^ 2),
                (660480 ^ 2),
                (1313280 ^ 2)
            ])
        })
        it('should scale values ==, !=, !!, <, >', async () => {
            const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
                { type: 'int16be', offset: 0, length: 1, offsetbit: 0, scale: '== 10', mask: '' },
                { type: 'int16le', offset: 0, length: 1, offsetbit: 0, scale: '!= 2560', mask: '' },
                { type: 'int16be', offset: 1, length: 1, offsetbit: 0, scale: '!!', mask: '' },
                { type: 'int16be', offset: 0, length: 1, offsetbit: 0, scale: '> 5', mask: '' },
                { type: 'int16be', offset: 0, length: 1, offsetbit: 0, scale: '< 5', mask: '' }
            ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
            const itemNames = flow.find(n => n.id === 'testNode').items.map((item, index) => item.name || `item${index + 1}`)
            await load(flow)
            const resultsPromise = new Promise((resolve, reject) => {
                catchHelper.on('input', function (msg) {
                    reject(new Error('Error caught: ' + msg.error.message))
                })
                helperNode1.on('input', function (msg) {
                    resolve(msg)
                })
            })
            const testData = Buffer.from([0, 0, 0, 0])
            testData.writeInt16BE(10, 0) // 16BE 10, 16LE 2560, 32BE 660480, 32LE 1313280
            testData.writeInt16LE(20, 2)
            testNode.receive({ payload: testData })
            const msg = await resultsPromise
            shouldHaveItemValues(msg.payload, itemNames, [
                true,
                false,
                true,
                true,
                false
            ])
        })
    })

    describe('byteswap values', () => {
        function shouldHaveItemValues (data, itemNames, expectedValues) {
            should.exist(data, 'payload should exist')
            data.should.be.an.Object()
            data.should.have.properties(itemNames)
            itemNames.forEach((itemName, index) => {
                data.should.have.property(itemName)
                data[itemName].should.eql(expectedValues[index], `${itemName} should have value ${expectedValues[index]}`)
            })
        }
        /** @type {import('node-red').Node} */ let testNode = null
        /** @type {import('node-red').Node} */ let helperNode1 = null
        /** @type {import('node-red').Node} */ let catchHelper = null
        // eslint-disable-next-line no-unused-vars
        /** @type {import('node-red').Node} */ let completeHelper = null
        async function load (flow) {
            await helper.load(bufferParser, flow)
            testNode = helper.getNode('testNode')
            helperNode1 = helper.getNode('helperNode1')
            catchHelper = helper.getNode('catchHelper')
            completeHelper = helper.getNode('completeHelper')
        }

        it('no swap', async () => {
            const flow = getTestFlow('testNode', 'test--buffer-parser', 'payload', [
                { type: 'uint16be', offset: 0, length: 1, offsetbit: 0, scale: '', mask: '' },
                { type: 'uint16le', offset: 0, length: 1, offsetbit: 0, scale: '', mask: '' },
                { type: 'int32be', offset: 0, length: 1, offsetbit: 0, scale: '', mask: '' },
                { type: 'int32le', offset: 0, length: 1, offsetbit: 0, scale: '', mask: '' },
                { type: 'float32be', offset: 0, length: 1, offsetbit: 0, scale: '', mask: '' },
                { type: 'float32le', offset: 0, length: 1, offsetbit: 0, scale: '', mask: '' }
            ], { resultType: 'keyvalue', resultTypeType: 'return', msgPropertyType: 'str', multipleResult: false, fanOutMultipleResult: false, setTopic: true })
            const itemNames = flow.find(n => n.id === 'testNode').items.map((item, index) => item.name || `item${index + 1}`)
            await load(flow)
            const resultsPromise = new Promise((resolve, reject) => {
                catchHelper.on('input', function (msg) {
                    reject(new Error('Error caught: ' + msg.error.message))
                })
                helperNode1.on('input', function (msg) {
                    resolve(msg)
                })
            })
            testNode.receive({ payload: Buffer.from([0, 15, 10, 25]) })
            const msg = await resultsPromise
            shouldHaveItemValues(msg.payload, itemNames, [12.5, 12.5, 3837.5, 985622.5, 420089597.5])
        })
    })
    // TODO: Test the following...
    /*
    * all functions
    * all output types
    * byte swaps
    * dynamic spec
    */
})

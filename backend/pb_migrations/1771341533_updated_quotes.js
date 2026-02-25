/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2527524235")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number1114376803",
    "max": null,
    "min": null,
    "name": "paidTotal",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "json1708301106",
    "maxSize": 0,
    "name": "payments",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "file2347729249",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "application/pdf"
    ],
    "name": "paymentProofFile",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2527524235")

  // remove field
  collection.fields.removeById("number1114376803")

  // remove field
  collection.fields.removeById("json1708301106")

  // remove field
  collection.fields.removeById("file2347729249")

  return app.save(collection)
})

const { Router } = require("express");
const router = Router();

const { searchWebsites } = require("../controller/controller");

router.get("/websites", searchWebsites);

module.exports = router;

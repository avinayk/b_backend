const express = require("express");
const router = express.Router();
const moduleController = require("../../controllers/admin/moduleController");
const upload = require("../../middlewares/uploadMiddleware");

router.post("/getmodulelist", moduleController.getmodulelist);

router.post("/savemodule", moduleController.savemodule);
router.post("/moduledelete", moduleController.moduledelete);
router.post("/getmodulerecord", moduleController.getmodulerecord);
router.post("/updatelimit", moduleController.updatelimit);
router.post("/getallUsersMeetinglist", moduleController.getallUsersMeetinglist);

router.post("/getallUsersDetaillist", moduleController.getallUsersDetaillist);
router.post("/mettingDelete", moduleController.mettingDelete);
router.post("/getallUserList", moduleController.getallUserList);

router.post("/getallcompnay", moduleController.getallcompnay);
router.post("/getallcatgeorylist", moduleController.getallcatgeorylist);
router.post("/dataroomcategorydelete", moduleController.dataroomcategorydelete);
router.post("/getsubcategorylist", moduleController.getsubcategorylist);
router.post("/savedataroomtip", moduleController.savedataroomtip);
router.post("/dataroomPaymentadd", moduleController.dataroomPaymentadd);
router.post("/getDataroompayment", moduleController.getDataroompayment);
router.post(
  "/userSubscriptionDataRoom",
  moduleController.userSubscriptionDataRoom
);
router.post("/getCheckOnetimePayment", moduleController.getCheckOnetimePayment);
router.post("/getcompanypayment", moduleController.getcompanypayment);
router.post(
  "/getcompanypaymentAnnual",
  moduleController.getcompanypaymentAnnual
);
router.post("/getPerinstanceFee", moduleController.getPerinstanceFee);
router.post("/addDataroomCategory", moduleController.addDataroomCategory);
router.post("/getcategoryData", moduleController.getcategoryData);
router.post("/deletesubcategory", moduleController.deletesubcategory);
router.post("/discountAddEdit", moduleController.discountAddEdit);
router.post("/getdiscountCode", moduleController.getdiscountCode);
router.post("/deletediscountcode", moduleController.deletediscountcode);
router.post("/geteditCodeData", moduleController.geteditCodeData);
router.post("/deletecompany", moduleController.deletecompany);
router.post("/checkCatgeory", moduleController.checkCatgeory);
router.post("/checkmoduleData", moduleController.checkmoduleData);
router.post("/createzoommeet", moduleController.createzoommeet);
router.post("/getzoomdata", moduleController.getzoomdata);
router.post("/emailtemplate", moduleController.emailtemplate);
router.post("/getemailtemplate", moduleController.getemailtemplate);
router.post("/emailtemplateDelete", moduleController.emailtemplateDelete);
router.post("/getemailtemplateSingle", moduleController.getemailtemplateSingle);
router.post("/getallUsersJoinedMeet", moduleController.getallUsersJoinedMeet);
module.exports = router;

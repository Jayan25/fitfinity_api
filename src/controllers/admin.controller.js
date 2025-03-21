const { Trainers, Admins,TrainerDocument,Users,enquiry,service_bookings,diet_plan } = require("../models/index")
const { ReE, ReS,sendEmail } = require("../utils/util.service");
const { generateToken } = require("../utils/jwtUtils");
const { off } = require("../../app");
const { Op } = require('sequelize')

module.exports.login = async function (req, res) {
  try {
    const { email, password } = req.body;
    let findTrainer = await Admins.findOne({
      where: {
        email
      }
    })
    console.log(findTrainer)
    console.log(password)
    if (!findTrainer) {
      return ReE(res, "Trainer not found!", 400)
    }


    if (findTrainer?.password !== password) {
      return ReE(res, "Password is not correct!");
    }
    const token = generateToken(findTrainer)

    return ReS(res, "Registration successful, Email is sent!", { token: token, type: 'bearer' });
  } catch (error) {
    console.error(error);
    return ReE(res, "Error during registration. Please try again.");
  }
};

module.exports.getAllTrainers = async function (req, res) {
  try {
    let { limit, offset, search } = req.query;

    limit = isNaN(Number(limit)) ? 10 : Number(limit);
    offset = isNaN(Number(offset)) ? 0 : Number(offset);

    let where = search ? {
      name: {
        [Op.like]: `${search}%`,
      },
    } : {};

    const trainers = await Trainers.findAndCountAll({
      where: where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true,
      include: [
        {
          model: TrainerDocument,
          as: 'trainer_documents',
          required: false,
        },
      ],
    });


    return ReS(res, "Trainers list fetched", trainers)

  } catch (error) {
    console.error("Error fetching trainers:", error);
    return ReE(res, "An error occurred while fetching trainers", 500)
  }
};

module.exports.getTrainerDetails = async function (req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return ReE(res, "Invalid trainer ID provided", 400)
    }

    const trainer = await Trainers.findOne({
      where: { id },
      paranoid: false,
      include: [
        {
          model: TrainerDocument,
          as: 'trainer_documents',
          required: false,
        },
      ],
    });


    if (!trainer) {
      return ReE(res, "Trainer not found!", 404);
    }


    return ReS(res, "Trainer details fetched successfully", trainer)
  } catch (error) {
    console.error("Error fetching trainer details:", error);
    return ReS(res, "An error occurred while fetching trainer details", 500)

  }
};



module.exports.deleteTrainer = async function (req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return ReE(res, "Invalid trainer ID provided", 400)
    }

    const trainer = await Trainers.findByPk(id);
    if (!trainer) {
      return ReE(res, "Trainer not found", 404)
    }

    await Trainers.update(
      { deleted_at: new Date() },
      { where: { id } }
    );

    return ReS(res, "Trainer deleted successfully")

  } catch (error) {
    console.error("Error deleting admin:", error);
    return ReE(res, "An error occurred while deleting the trainer", 500)
  }
};

module.exports.blockUnblock = async function (req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || isNaN(id)) {
      return ReE(res, "Invalid trainer ID provided", 400)
    }

    const trainer = await Trainers.findByPk(id);
    if (!trainer) {
      return ReE(res, "Trainer not found", 404)
    }

    let data = await Trainers.update(
      { block_status: status },
      { where: { id } }
    );

    return ReS(res, "Trainer updated successfully")

  } catch (error) {
    console.error("Error deleting admin:", error);
    return ReE(res, "An error occurred while updating the trainer", 500)
  }
};

module.exports.updateDocument = async function (req, res) {
  try {
    const { id } = req.params;
    const { verification_status } = req.body;
    if (!id || isNaN(id)) {
      return ReE(res, "Invalid trainer ID provided", 400)
    }


    // let data = await Trainers.update(
    //   { verification_status: verification_status },
    //   { where: { id } }
    // );

    console.log("id=======",id)
    let where={
      id:id
    }
   let data= await TrainerDocument.update({
      verfication_status:verification_status
    },
    {
      where
    }
    )

    console.log("data===========",data)
    

    return ReS(res, "Trainer documnet status updated!")

  } catch (error) {
    console.error("Error while updating trainer", error);
    return ReE(res, "An error occurred while updating the trainer", 500)
  }
};
module.exports.verifyTrainerKyc = async function (req, res) {
  try {
    const { id } = req.params;
    const { kyc_status } = req.body;
    if (!id || isNaN(id)) {
      return ReE(res, "Invalid trainer ID provided", 400)
    }

    let trainerData=await Trainers.findOne({where:{id}});

    if(!trainerData)
    {
      return ReE(res,"Trainer not found!",404);
    }
     await Trainers.update(
      { kyc_status: kyc_status },
      { where: { id } }
    );

    let where={
      trainer_id:id
    }
   await TrainerDocument.update({
      verfication_status:"success"
    },
    {
      where
    }
    )
  let emailData = {
    email: trainerData.email,
    name:trainerData.name
  }

   await sendEmail(emailData)

    return ReS(res, "Trainer key status updated!")

  } catch (error) {
    console.error("Error while updating trainer", error);
    return ReE(res, "An error occurred while updating the trainer", 500)
  }
};




module.exports.getAllUsers = async function (req, res) {
  try {
    let { limit, offset, search } = req.query;
    
    limit = isNaN(Number(limit)) ? 10 : Number(limit);
    offset = isNaN(Number(offset)) ? 0 : Number(offset);
    let where = search ? {
      name: {
        [Op.like]: `${search}%`,
      },
    } : {};

    const userList = await Users.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] },
      distinct: true,
    });
    return ReS(res, "User list fetched", userList)
  } catch (error) {
    console.error("Error fetching Users:", error);
    return ReE(res, "An error occurred while fetching trainers", 500)
  }
};


module.exports.getAllNatalEnquiry = async function (req, res) {
  try {
    let { limit, offset, search } = req.query;
    
    limit = isNaN(Number(limit)) ? 10 : Number(limit);
    offset = isNaN(Number(offset)) ? 0 : Number(offset);
    let where = search ? {
      name: {
        [Op.like]: `${search}%`,
      },
      enquiry_for:"natal"
    } : {enquiry_for:"natal"};

    const natalList = await enquiry.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes:{exclude:["user_id"]}
    });
    return ReS(res, "Natal list fetched", natalList)

  } catch (error) {
    console.error("Error fetching Users:", error);
    return ReE(res, "An error occurred while fetching natal enquiry", 500)
  }
};


module.exports.getAllCorporateEnquiry = async function (req, res) {
  try {
    let { limit, offset, search } = req.query;
    
    limit = isNaN(Number(limit)) ? 10 : Number(limit);
    offset = isNaN(Number(offset)) ? 0 : Number(offset);
    let where = search ? {
      name: {
        [Op.like]: `${search}%`,
      },
      enquiry_for:"corporate"
    } : {enquiry_for:"corporate"};

    const corporateList = await enquiry.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes:{exclude:["user_id"]}
    });

    return ReS(res, "Corporate list fetched", corporateList)

  } catch (error) {
    console.error("Error fetching Users:", error);
    return ReE(res, "An error occurred while fetching Corporate enquiry", 500)
  }
};
module.exports.getAllFitnessgPayment = async function (req, res) {
  try {
    let { limit, offset, search } = req.query;
    
    limit = isNaN(Number(limit)) ? 10 : Number(limit);
    offset = isNaN(Number(offset)) ? 0 : Number(offset);
    let where = search ? {
      name: {
        [Op.like]: `${search}%`,
      },
      service_type:"fitness"
    } : {  service_type:"fitness"};

    const serviceBookingList = await service_bookings.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Users,
          as: "user",
          attributes: ['id', 'name', 'email',"mobile","address"] // Add any fields you want from the Users table
        }
      ],
    });
    return ReS(res, "Fitness Payment feteched", serviceBookingList)
  } catch (error) {
    console.error("Error fetching Users:", error);
    return ReE(res, "An error occurred while fetching Fitness Payment", 500)
  }
};
module.exports.getAllYogaPayment = async function (req, res) {
  try {
    let { limit, offset, search } = req.query;
    limit = isNaN(Number(limit)) ? 10 : Number(limit);
    offset = isNaN(Number(offset)) ? 0 : Number(offset);
    let where = search ? {
      name: {
        [Op.like]: `${search}%`,
      },
      service_type:"yoga"
    } : {  service_type:"yoga"};

    const serviceBookingList = await service_bookings.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Users,
          as: "user",
          attributes: ['id', 'name', 'email',"mobile","address"] // Add any fields you want from the Users table
        }
      ],
    });
    return ReS(res, "Yoga Payment feteched", serviceBookingList)

  } catch (error) {
    console.error("Error fetching Users:", error);
    return ReE(res, "An error occurred while fetching Yoga Payment", 500)
  }
};

module.exports.getAlldietPlanPayment = async function (req, res) {
  try {
    let { limit, offset, search } = req.query;
    limit = isNaN(Number(limit)) ? 10 : Number(limit);
    offset = isNaN(Number(offset)) ? 0 : Number(offset);
    let where = search ? {
      name: {
        [Op.like]: `${search}%`,
      },
    } : { };

    const serviceBookingList = await diet_plan.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Users,
          as: "user",
          attributes: ['id', 'name', 'email',"mobile","address"] // Add any fields you want from the Users table
        }
      ],
    });

    return ReS(res, "Diet Payment feteched", serviceBookingList)

  } catch (error) {
    console.error("Error fetching Users:", error);
    return ReE(res, "An error occurred while fetching Diet Payment", 500)
  }
};



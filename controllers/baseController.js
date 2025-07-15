const baseController = {}

baseController.buildHome = async function(req, res){
    res.render("index", {title: "Home"})
}

module.exports = baseController
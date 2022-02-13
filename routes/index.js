const attachRoutes = (app) => {
  app.get("/", (req, res) => {
    console.log("Route GET /");
    res.render("home");
  });
};

export default attachRoutes;

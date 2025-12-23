//////////////////////////////////////////////////////
// REGISTER
//////////////////////////////////////////////////////

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, dateOfBirth } = req.body;

    // validation
    if (!fullName || !email || !password || !dateOfBirth) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // generate username تلقائي (مناسب للموبايل)
    const username = email.split("@")[0];

    const user = new User({
      username,               // كان undefined قبل كده
      email,
      password: hashedPassword,
      dateOfBirth,            // محفوظة دلوقتي
      isVerified: false,
    });

    // verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const hashedCode = await bcrypt.hash(verificationCode, 10);

    user.verificationCode = hashedCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendEmail(
      user.email,
      "Your Verification Code",
      `Your verification code is: ${verificationCode}`
    );

    res.status(201).json({
      message: "User registered. Check your email for verification.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error in register",
      error: err.message,
    });
  }
});

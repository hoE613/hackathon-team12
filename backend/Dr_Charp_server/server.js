const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET;

// JWT 생성
function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );
}

// 로그인 확인
function authMiddleware(req, res, next) {

  const authHeader =
    req.headers.authorization;

  const token =
    authHeader &&
    authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "로그인이 필요합니다.",
    });
  }

  try {

    const decoded = jwt.verify(
      token,
      ACCESS_TOKEN_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(403).json({
      message: "토큰 오류",
    });
  }
}

// 서버 확인
app.get("/", (req, res) => {

  res.json({
    project: "dr.charp_charp",
    message: "서버 실행 중",
  });
});

// 회원가입
app.post("/auth/signup", async (req, res) => {

  const {
    email,
    password,
    nickname
  } = req.body;

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (existingUser) {

    return res.status(400).json({
      message:
        "이미 존재하는 이메일",
    });
  }

  const hashedPassword =
    await bcrypt.hash(password, 10);

  const user =
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
      },
    });

  res.json({
    message: "회원가입 성공",
    user,
  });
});

// 로그인
app.post("/auth/login", async (req, res) => {

  const {
    email,
    password
  } = req.body;

  const user =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (!user) {

    return res.status(401).json({
      message:
        "이메일 또는 비밀번호 오류",
    });
  }

  const isMatch =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!isMatch) {

    return res.status(401).json({
      message:
        "이메일 또는 비밀번호 오류",
    });
  }

  const accessToken =
    createToken(user);

  res.json({
    message: "로그인 성공",
    accessToken,
  });
});

// 게시글 작성
app.post(
  "/posts",
  authMiddleware,
  async (req, res) => {

    const {
      title,
      content
    } = req.body;

    const post =
      await prisma.post.create({
        data: {
          title,
          content,
          authorId:
            req.user.id,
        },
      });

    res.json({
      message:
        "게시글 작성 성공",
      post,
    });
  }
);

// 게시글 목록
app.get("/posts", async (req, res) => {

  const posts =
    await prisma.post.findMany({
      include: {
        author: {
          select: {
            nickname: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  res.json(posts);
});

// 랭킹
app.get(
  "/posts/ranking",
  async (req, res) => {

    const ranking =
      await prisma.post.findMany({
        orderBy: [
          {
            score: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: 10,
      });

    res.json(ranking);
  }
);

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `dr.charp_charp server: ${PORT}`
  );
});
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../types/prisma.types";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../errors/AppError";
import { env } from "../config/env";

const SALT_ROUNDS = 12;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthPayload {
  user: Pick<User, "id" | "email">;
  tokens: TokenPair;
}

export class AuthService {
  constructor(private readonly userRepo: UserRepository) {}

  private signAccessToken(userId: string, email: string): string {
    return jwt.sign({ sub: userId, email }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions["expiresIn"],
    });
  }

  private signRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions["expiresIn"],
    });
  }

  async register(email: string, password: string): Promise<AuthPayload> {
    const exists = await this.userRepo.emailExists(email);
    if (exists) {
      throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.userRepo.create({
      email,
      passwordHash,
      dataEncryptionKeyId: "", // Set up per-user DEK in Phase 1 CSFLE setup
      preferences: {},
    });

    const typedUser = user as User;
    return {
      user: { id: typedUser.id, email: typedUser.email },
      tokens: {
        accessToken: this.signAccessToken(typedUser.id, typedUser.email),
        refreshToken: this.signRefreshToken(typedUser.id),
      },
    };
  }

  async login(email: string, password: string): Promise<AuthPayload> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    return {
      user: { id: user.id, email: user.email },
      tokens: {
        accessToken: this.signAccessToken(user.id, user.email),
        refreshToken: this.signRefreshToken(user.id),
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    } catch {
      throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    const user = await this.userRepo.getById(payload.sub);
    if (!user) {
      throw new AppError("User not found", 401, "USER_NOT_FOUND");
    }

    return {
      accessToken: this.signAccessToken(user.id, user.email),
      refreshToken: this.signRefreshToken(user.id),
    };
  }
}

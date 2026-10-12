import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI가 설정되지 않았습니다. .env.local을 확인하세요.')
}

/**
 * Next.js의 개발 모드 HMR은 모듈을 반복해서 평가하므로, 연결을 전역에
 * 캐싱하지 않으면 리로드마다 커넥션이 쌓여 Atlas의 연결 한도를 넘깁니다.
 */
type Cached = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: Cached | undefined
}

const cached: Cached = global._mongoose ?? { conn: null, promise: null }
global._mongoose = cached

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI!, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      })
      .then((m) => m)
      .catch((err) => {
        // 실패한 프로미스를 캐시에 남겨두면 이후 요청이 전부 같은 에러로 죽습니다.
        cached.promise = null
        throw err
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect

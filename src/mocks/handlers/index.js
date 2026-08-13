import { bagHandlers } from './bag.js'
import { boardingPassHandlers } from './boardingPass.js'
import { passportHandlers } from './passport.js'
import { sessionHandlers } from './session.js'

export const handlers = [
  ...sessionHandlers,
  ...bagHandlers,
  ...boardingPassHandlers,
  ...passportHandlers,
]

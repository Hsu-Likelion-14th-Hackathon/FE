import { bagHandlers } from './bag.js'
import { boardingPassHandlers } from './boardingPass.js'
import { passportHandlers } from './passport.js'

export const handlers = [...bagHandlers, ...boardingPassHandlers, ...passportHandlers]

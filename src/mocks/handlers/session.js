import { http, HttpResponse } from 'msw'

import { API } from '@/shared/api/endpoints.js'

import { getAuthFixture } from '../devFixtures.js'
import { authenticatedSession, guestSession } from '../fixtures/session.js'

export const sessionHandlers = [
  http.get(API.session, () =>
    HttpResponse.json(getAuthFixture() === 'guest' ? guestSession : authenticatedSession),
  ),
]

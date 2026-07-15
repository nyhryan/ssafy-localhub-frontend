import { http, HttpResponse } from "msw"

export const festivalHandlers = [

    http.get("/api/v1/festivals", () => {

        return HttpResponse.json([
            {
                id: 1,
                title: "서울 재즈 페스타",
                date: "2026-07-18",
                region: "서울",
                location: "서울광장",
                summary: "..."
            }
        ])

    }),

]
-- Enhanced v_my_dm_threads view with complete profile information
-- Includes avatar, role, job title, company for rich conversation UI

CREATE OR REPLACE VIEW "public"."v_my_dm_threads" AS
 SELECT "t"."id" AS "thread_id",
    "t"."user_a",
    "t"."user_b",
        CASE
            WHEN ("t"."user_a" = "auth"."uid"()) THEN "t"."user_b"
            ELSE "t"."user_a"
        END AS "other_user_id",
    "p"."full_name" AS "other_user_name",
    "p"."avatar_url" AS "other_user_avatar_url",
    "p"."current_job_title" AS "other_user_title",
    "p"."company_name" AS "other_user_company",
    "p"."role" AS "other_user_role",
    "public"."are_users_connected"("t"."user_a", "t"."user_b") AS "can_send",
    0 AS "unread_count"
   FROM ("public"."dm_threads" "t"
     JOIN "public"."profiles" "p" ON (("p"."id" =
        CASE
            WHEN ("t"."user_a" = "auth"."uid"()) THEN "t"."user_b"
            ELSE "t"."user_a"
        END)))
  WHERE (("auth"."uid"() = "t"."user_a") OR ("auth"."uid"() = "t"."user_b"));

-- Grant permissions
GRANT ALL ON TABLE "public"."v_my_dm_threads" TO "anon";
GRANT ALL ON TABLE "public"."v_my_dm_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."v_my_dm_threads" TO "service_role";

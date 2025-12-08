| table_name |
| ------------------------- |
| group_posts |
| bookmarked_jobs |
| achievements |
| connections |
| events |
| conversation_participants |
| conversations |
| education_history |
| event_feedback |
| job_applications |
| groups |
| job_listings |
| jobs |
| mentor_profiles |
| mentor_availability |
| mentorship_relationships |
| mentorship_requests |
| permissions |
| notification_preferences |
| resume_profiles |
| role_permissions |
| roles |
| user_activity_logs |
| user_resumes |
| activity_logs |
| companies |
| content_approvals |
| event_attendees |
| profiles |
| group_members |
| job_alerts |
| mentee_profiles |
| mentees |
| mentors |
| system_alerts |
| mentorship_appointments |
| mentorship_programs |
| messages |
| notifications |
| system_analytics |
| user_roles |
| mentorships |
| admin_actions |
| resources |
| event_rsvps |
| job_bookmarks |
| content_moderation |
| networking_groups |
| networking_group_members |
| table_name | rls_enabled |
| ------------------------- | ----------- |
| group_posts | true |
| connections | true |
| events | true |
| conversations | true |
| conversation_participants | true |
| bookmarked_jobs | true |
| achievements | true |
| education_history | true |
| event_feedback | true |
| jobs | true |
| mentor_availability | true |
| job_applications | true |
| job_listings | true |
| groups | true |
| mentor_profiles | true |
| roles | true |
| user_resumes | true |
| mentorship_requests | true |
| permissions | false |
| user_activity_logs | true |
| resume_profiles | true |
| notification_preferences | true |
| role_permissions | false |
| mentorship_relationships | true |
| profiles | true |
| event_attendees | true |
| group_members | true |
| activity_logs | true |
| content_approvals | true |
| companies | false |
| job_alerts | true |
| mentee_profiles | true |
| messages | true |
| mentees | true |
| mentors | true |
| mentorship_appointments | true |
| mentorship_programs | true |
| notifications | true |
| system_analytics | false |
| user_roles | true |
| mentorships | true |
| admin_actions | true |
| system_alerts | true |
| resources | true |
| job_bookmarks | true |
| event_rsvps | true |
| content_moderation | true |
| networking_groups | false |
| networking_group_members | false |
| table_name | column_name | foreign_table | foreign_column |
| ------------------------- | ------------------------ | ------------------- | -------------- |
| achievements | profile_id | profiles | id |
| activity_logs | profile_id | profiles | id |
| bookmarked_jobs | job_id | jobs | id |
| connections | recipient_id | profiles | id |
| connections | requester_id | profiles | id |
| content_approvals | creator_id | profiles | id |
| content_approvals | reviewer_id | profiles | id |
| conversation_participants | conversation_id | conversations | id |
| conversation_participants | user_id | profiles | id |
| education_history | user_id | profiles | id |
| event_attendees | event_id | events | id |
| event_feedback | event_id | events | id |
| event_feedback | user_id | profiles | id |
| events | user_id | profiles | id |
| jobs | company_id | companies | id |
| group_members | group_id | groups | id |
| group_posts | group_id | groups | id |
| group_posts | parent_post_id | group_posts | id |
| job_alerts | user_id | profiles | id |
| job_applications | applicant_id | profiles | id |
| job_applications | job_id | job_listings | id |
| job_listings | creator_id | profiles | id |
| jobs | posted_by | profiles | id |
| jobs | user_id | profiles | id |
| mentee_profiles | user_id | profiles | id |
| mentees | user_id | profiles | id |
| mentor_availability | mentor_id | mentors | id |
| mentor_profiles | user_id | profiles | id |
| mentors | user_id | profiles | id |
| mentorship_appointments | availability_id | mentor_availability | id |
| mentorship_appointments | mentee_id | mentees | id |
| mentorship_relationships | mentee_id | profiles | id |
| mentorship_relationships | mentor_id | profiles | id |
| mentorship_relationships | program_id | mentorship_programs | id |
| mentorship_requests | mentee_id | profiles | id |
| mentorship_requests | mentor_id | profiles | id |
| messages | conversation_id | conversations | id |
| messages | sender_id | profiles | id |
| notification_preferences | user_id | profiles | id |
| notifications | profile_id | profiles | id |
| profiles | verification_reviewed_by | profiles | id |
| role_permissions | permission_id | permissions | id |
| user_activity_logs | user_id | profiles | id |
| user_resumes | user_id | profiles | id |
| user_roles | role_id | roles | id |
| event_rsvps | event_id | events | id |
| job_bookmarks | job_id | jobs | id |
| admin_actions | admin_id | profiles | id |
| system_alerts | resolved_by | profiles | id |
| content_moderation | moderator_id | profiles | id |
| networking_group_members | group_id | networking_groups | id |
| messages | recipient_id | profiles | id |
| event_attendees | attendee_id | profiles | id |
| group_members | user_id | profiles | id |
| group_posts | user_id | profiles | id |
| table_name | constraint_name | constraint_type |
| ------------------------- | ----------------------------------------------------------- | --------------- |
| group_posts | fk_group_posts_user | FOREIGN KEY |
| group_posts | group_posts_group_id_fkey | FOREIGN KEY |
| group_posts | group_posts_parent_post_id_fkey | FOREIGN KEY |
| group_posts | group_posts_pkey | PRIMARY KEY |
| group_posts | group_posts_user_id_fkey | FOREIGN KEY |
| bookmarked_jobs | bookmarked_jobs_job_id_fkey | FOREIGN KEY |
| bookmarked_jobs | bookmarked_jobs_pkey | PRIMARY KEY |
| bookmarked_jobs | bookmarked_jobs_user_id_fkey | FOREIGN KEY |
| bookmarked_jobs | unique_user_job_bookmark | UNIQUE |
| achievements | achievements_achievement_type_check | CHECK |
| achievements | achievements_pkey | PRIMARY KEY |
| achievements | achievements_profile_id_fkey | FOREIGN KEY |
| connections | connections_pkey | PRIMARY KEY |
| connections | connections_recipient_id_fkey | FOREIGN KEY |
| connections | connections_requester_id_fkey | FOREIGN KEY |
| connections | connections_requester_id_recipient_id_key | UNIQUE |
| connections | connections_status_check | CHECK |
| connections | different_requester_recipient | CHECK |
| events | events_created_by_fkey | FOREIGN KEY |
| events | events_creator_id_fkey | FOREIGN KEY |
| events | events_organizer_id_fkey | FOREIGN KEY |
| events | events_pkey | PRIMARY KEY |
| events | events_slug_unique | UNIQUE |
| events | events_user_id_fkey | FOREIGN KEY |
| conversation_participants | conversation_participants_conversation_id_fkey | FOREIGN KEY |
| conversation_participants | conversation_participants_pkey | PRIMARY KEY |
| conversation_participants | conversation_participants_user_id_fkey | FOREIGN KEY |
| conversations | conversations_pkey | PRIMARY KEY |
| education_history | education_history_pkey | PRIMARY KEY |
| education_history | education_history_user_id_fkey | FOREIGN KEY |
| event_feedback | event_feedback_event_id_fkey | FOREIGN KEY |
| event_feedback | event_feedback_event_id_user_id_key | UNIQUE |
| event_feedback | event_feedback_pkey | PRIMARY KEY |
| event_feedback | event_feedback_rating_check | CHECK |
| event_feedback | event_feedback_user_id_fkey | FOREIGN KEY |
| job_applications | job_applications_applicant_id_fkey | FOREIGN KEY |
| job_applications | job_applications_job_id_applicant_id_key | UNIQUE |
| job_applications | job_applications_job_id_fkey | FOREIGN KEY |
| job_applications | job_applications_pkey | PRIMARY KEY |
| job_applications | job_applications_status_check | CHECK |
| groups | groups_created_by_fkey | FOREIGN KEY |
| groups | groups_pkey | PRIMARY KEY |
| job_listings | job_listings_creator_id_fkey | FOREIGN KEY |
| job_listings | job_listings_job_type_check | CHECK |
| job_listings | job_listings_pkey | PRIMARY KEY |
| jobs | fk_jobs_company_id | FOREIGN KEY |
| jobs | jobs_created_by_fkey | FOREIGN KEY |
| jobs | jobs_pkey | PRIMARY KEY |
| jobs | jobs_posted_by_fkey | FOREIGN KEY |
| jobs | jobs_user_id_fkey | FOREIGN KEY |
| mentor_profiles | mentor_profiles_pkey | PRIMARY KEY |
| mentor_profiles | mentor_profiles_user_id_fkey | FOREIGN KEY |
| mentor_availability | mentor_availability_mentor_id_fkey | FOREIGN KEY |
| mentor_availability | mentor_availability_pkey | PRIMARY KEY |
| mentor_availability | time_range_check | CHECK |
| mentorship_relationships | mentorship_relationships_mentee_id_fkey | FOREIGN KEY |
| mentorship_relationships | mentorship_relationships_mentor_id_fkey | FOREIGN KEY |
| mentorship_relationships | mentorship_relationships_mentor_id_mentee_id_program_id_key | UNIQUE |
| mentorship_relationships | mentorship_relationships_pkey | PRIMARY KEY |
| mentorship_relationships | mentorship_relationships_program_id_fkey | FOREIGN KEY |
| mentorship_relationships | mentorship_relationships_status_check | CHECK |
| mentorship_requests | mentorship_requests_mentee_id_fkey | FOREIGN KEY |
| mentorship_requests | mentorship_requests_mentee_id_mentor_id_key | UNIQUE |
| mentorship_requests | mentorship_requests_mentor_id_fkey | FOREIGN KEY |
| mentorship_requests | mentorship_requests_pkey | PRIMARY KEY |
| mentorship_requests | mentorship_requests_status_check | CHECK |
| permissions | permissions_name_key | UNIQUE |
| permissions | permissions_pkey | PRIMARY KEY |
| notification_preferences | notification_preferences_pkey | PRIMARY KEY |
| notification_preferences | notification_preferences_user_id_fkey | FOREIGN KEY |
| notification_preferences | notification_preferences_user_id_notification_type_key | UNIQUE |
| resume_profiles | resume_profiles_pkey | PRIMARY KEY |
| resume_profiles | resume_profiles_user_id_fkey | FOREIGN KEY |
| role_permissions | role_permissions_permission_id_fkey | FOREIGN KEY |
| role_permissions | role_permissions_pkey | PRIMARY KEY |
| roles | roles_name_key | UNIQUE |
| roles | roles_pkey | PRIMARY KEY |
| user_activity_logs | user_activity_logs_pkey | PRIMARY KEY |
| user_activity_logs | user_activity_logs_user_id_fkey | FOREIGN KEY |
| user_resumes | user_resumes_pkey | PRIMARY KEY |
| user_resumes | user_resumes_user_id_fkey | FOREIGN KEY |
| activity_logs | activity_logs_pkey | PRIMARY KEY |
| activity_logs | activity_logs_profile_id_fkey | FOREIGN KEY |
| companies | companies_name_key | UNIQUE |
| companies | companies_pkey | PRIMARY KEY |
| content_approvals | content_approvals_creator_id_fkey | FOREIGN KEY |
| content_approvals | content_approvals_pkey | PRIMARY KEY |
| content_approvals | content_approvals_reviewer_id_fkey | FOREIGN KEY |
| content_approvals | content_approvals_status_check | CHECK |
| event_attendees | event_attendees_attendee_id_fkey | FOREIGN KEY |
| event_attendees | event_attendees_event_id_attendee_id_key | UNIQUE |
| event_attendees | event_attendees_event_id_fkey | FOREIGN KEY |
| event_attendees | event_attendees_event_id_user_id_key | UNIQUE |
| event_attendees | event_attendees_pkey | PRIMARY KEY |
| event_attendees | event_attendees_user_id_fkey | FOREIGN KEY |
| profiles | profiles_alumni_verification_status_check | CHECK |
| profiles | profiles_email_key | UNIQUE |
| profiles | profiles_id_fkey | FOREIGN KEY |
| profiles | profiles_mentee_status_check | CHECK |
| profiles | profiles_mentor_status_check | CHECK |
| profiles | profiles_pkey | PRIMARY KEY |
| profiles | profiles_verification_reviewed_by_fkey | FOREIGN KEY |
| group_members | fk_group_members_user_id | FOREIGN KEY |
| group_members | group_members_group_id_fkey | FOREIGN KEY |
| group_members | group_members_pkey | PRIMARY KEY |
| group_members | group_members_role_check | CHECK |
| group_members | group_members_user_id_fkey | FOREIGN KEY |
| job_alerts | job_alerts_frequency_check | CHECK |
| job_alerts | job_alerts_pkey | PRIMARY KEY |
| job_alerts | job_alerts_user_id_fkey | FOREIGN KEY |
| mentee_profiles | mentee_profiles_pkey | PRIMARY KEY |
| mentee_profiles | mentee_profiles_user_id_fkey | FOREIGN KEY |
| mentee_profiles | user_id_unique_mentee_profile | UNIQUE |
| mentees | mentees_pkey | PRIMARY KEY |
| mentees | mentees_status_check | CHECK |
| mentees | mentees_user_id_fkey | FOREIGN KEY |
| mentors | mentors_pkey | PRIMARY KEY |
| mentors | mentors_status_check | CHECK |
| mentors | mentors_user_id_fkey | FOREIGN KEY |
| mentors | mentors_user_id_unique | UNIQUE |
| system_alerts | system_alerts_pkey | PRIMARY KEY |
| system_alerts | system_alerts_resolved_by_fkey | FOREIGN KEY |
| mentorship_appointments | mentorship_appointments_availability_id_fkey | FOREIGN KEY |
| mentorship_appointments | mentorship_appointments_mentee_id_fkey | FOREIGN KEY |
| mentorship_appointments | mentorship_appointments_pkey | PRIMARY KEY |
| mentorship_appointments | mentorship_appointments_status_check | CHECK |
| mentorship_programs | mentorship_programs_pkey | PRIMARY KEY |
| messages | messages_content_check | CHECK |
| messages | messages_conversation_id_fkey | FOREIGN KEY |
| messages | messages_pkey | PRIMARY KEY |
| messages | messages_recipient_id_fkey | FOREIGN KEY |
| messages | messages_sender_id_fkey | FOREIGN KEY |
| notifications | notifications_pkey | PRIMARY KEY |
| notifications | notifications_profile_id_fkey | FOREIGN KEY |
| system_analytics | system_analytics_pkey | PRIMARY KEY |
| user_roles | user_roles_pkey | PRIMARY KEY |
| user_roles | user_roles_profile_id_role_id_key | UNIQUE |
| user_roles | user_roles_role_id_fkey | FOREIGN KEY |
| mentorships | mentorships_mentee_id_fkey | FOREIGN KEY |
| mentorships | mentorships_mentor_id_fkey | FOREIGN KEY |
| mentorships | mentorships_mentor_id_mentee_id_key | UNIQUE |
| mentorships | mentorships_pkey | PRIMARY KEY |
| mentorships | mentorships_status_check | CHECK |
| admin_actions | admin_actions_admin_id_fkey | FOREIGN KEY |
| admin_actions | admin_actions_pkey | PRIMARY KEY |
| resources | resources_created_by_fkey | FOREIGN KEY |
| resources | resources_pkey | PRIMARY KEY |
| event_rsvps | event_rsvps_event_id_fkey | FOREIGN KEY |
| event_rsvps | event_rsvps_event_id_user_id_key | UNIQUE |
| event_rsvps | event_rsvps_pkey | PRIMARY KEY |
| event_rsvps | event_rsvps_user_id_fkey | FOREIGN KEY |
| job_bookmarks | job_bookmarks_job_id_fkey | FOREIGN KEY |
| job_bookmarks | job_bookmarks_job_id_user_id_key | UNIQUE |
| job_bookmarks | job_bookmarks_pkey | PRIMARY KEY |
| job_bookmarks | job_bookmarks_user_id_fkey | FOREIGN KEY |
| content_moderation | content_moderation_moderator_id_fkey | FOREIGN KEY |
| content_moderation | content_moderation_pkey | PRIMARY KEY |
| networking_groups | networking_groups_pkey | PRIMARY KEY |
| networking_group_members | networking_group_members_group_id_fkey | FOREIGN KEY |
| networking_group_members | networking_group_members_group_id_user_id_key | UNIQUE |
| networking_group_members | networking_group_members_pkey | PRIMARY KEY |
| networking_group_members | networking_group_members_user_id_fkey | FOREIGN KEY |
| group_posts | 2200_17812_1_not_null | CHECK |
| group_posts | 2200_17812_2_not_null | CHECK |
| group_posts | 2200_17812_3_not_null | CHECK |
| group_posts | 2200_17812_5_not_null | CHECK |
| bookmarked_jobs | 2200_17688_1_not_null | CHECK |
| bookmarked_jobs | 2200_17688_2_not_null | CHECK |
| bookmarked_jobs | 2200_17688_3_not_null | CHECK |
| bookmarked_jobs | 2200_17688_4_not_null | CHECK |
| achievements | 2200_17672_1_not_null | CHECK |
| achievements | 2200_17672_3_not_null | CHECK |
| connections | 2200_17701_1_not_null | CHECK |
| events | 2200_17748_1_not_null | CHECK |
| events | 2200_17748_2_not_null | CHECK |
| events | 2200_17748_4_not_null | CHECK |
| events | 2200_17748_5_not_null | CHECK |
| events | 2200_17748_6_not_null | CHECK |
| events | 2200_17748_7_not_null | CHECK |
| events | 2200_17748_11_not_null | CHECK |
| events | 2200_17748_14_not_null | CHECK |
| conversation_participants | 2200_17721_1_not_null | CHECK |
| conversation_participants | 2200_17721_2_not_null | CHECK |
| conversation_participants | 2200_17721_3_not_null | CHECK |
| conversations | 2200_17725_1_not_null | CHECK |
| conversations | 2200_17725_2_not_null | CHECK |
| conversations | 2200_17725_3_not_null | CHECK |
| education_history | 2200_17732_1_not_null | CHECK |
| education_history | 2200_17732_3_not_null | CHECK |
| education_history | 2200_17732_4_not_null | CHECK |
| event_feedback | 2200_17792_1_not_null | CHECK |
| job_applications | 2200_17839_1_not_null | CHECK |
| groups | 2200_17820_1_not_null | CHECK |
| groups | 2200_17820_2_not_null | CHECK |
| groups | 2200_17820_7_not_null | CHECK |
| job_listings | 2200_17849_1_not_null | CHECK |
| job_listings | 2200_17849_3_not_null | CHECK |
| job_listings | 2200_17849_4_not_null | CHECK |
| job_listings | 2200_17849_5_not_null | CHECK |
| jobs | 2200_17860_1_not_null | CHECK |
| jobs | 2200_17860_2_not_null | CHECK |
| jobs | 2200_17860_3_not_null | CHECK |
| jobs | 2200_17860_28_not_null | CHECK |
| mentor_profiles | 2200_17896_1_not_null | CHECK |
| mentor_availability | 2200_17888_1_not_null | CHECK |
| mentor_availability | 2200_17888_3_not_null | CHECK |
| mentor_availability | 2200_17888_4_not_null | CHECK |
| mentor_availability | 2200_17888_5_not_null | CHECK |
| mentorship_relationships | 2200_17938_1_not_null | CHECK |
| mentorship_requests | 2200_17948_1_not_null | CHECK |
| permissions | 2200_17985_1_not_null | CHECK |
| permissions | 2200_17985_2_not_null | CHECK |
| permissions | 2200_17985_4_not_null | CHECK |
| permissions | 2200_17985_5_not_null | CHECK |
| notification_preferences | 2200_17965_1_not_null | CHECK |
| notification_preferences | 2200_17965_3_not_null | CHECK |
| resume_profiles | 2200_17993_1_not_null | CHECK |
| resume_profiles | 2200_17993_2_not_null | CHECK |
| role_permissions | 2200_18004_1_not_null | CHECK |
| role_permissions | 2200_18004_2_not_null | CHECK |
| role_permissions | 2200_18004_3_not_null | CHECK |
| roles | 2200_18008_1_not_null | CHECK |
| roles | 2200_18008_2_not_null | CHECK |
| roles | 2200_18008_4_not_null | CHECK |
| user_activity_logs | 2200_18024_1_not_null | CHECK |
| user_activity_logs | 2200_18024_3_not_null | CHECK |
| user_resumes | 2200_18031_1_not_null | CHECK |
| user_resumes | 2200_18031_3_not_null | CHECK |
| user_resumes | 2200_18031_4_not_null | CHECK |
| activity_logs | 2200_17681_1_not_null | CHECK |
| activity_logs | 2200_17681_3_not_null | CHECK |
| activity_logs | 2200_17681_4_not_null | CHECK |
| activity_logs | 2200_17681_5_not_null | CHECK |
| companies | 2200_17693_1_not_null | CHECK |
| companies | 2200_17693_2_not_null | CHECK |
| companies | 2200_17693_4_not_null | CHECK |
| companies | 2200_17693_5_not_null | CHECK |
| content_approvals | 2200_17712_1_not_null | CHECK |
| content_approvals | 2200_17712_3_not_null | CHECK |
| content_approvals | 2200_17712_5_not_null | CHECK |
| content_approvals | 2200_17712_7_not_null | CHECK |
| event_attendees | 2200_17739_1_not_null | CHECK |
| event_attendees | 2200_17739_2_not_null | CHECK |
| event_attendees | 2200_17739_4_not_null | CHECK |
| event_attendees | 2200_17739_5_not_null | CHECK |
| event_attendees | 2200_17739_6_not_null | CHECK |
| profiles | 2200_17762_1_not_null | CHECK |
| profiles | 2200_17762_2_not_null | CHECK |
| profiles | 2200_17762_63_not_null | CHECK |
| group_members | 2200_17804_1_not_null | CHECK |
| group_members | 2200_17804_2_not_null | CHECK |
| group_members | 2200_17804_3_not_null | CHECK |
| job_alerts | 2200_17829_1_not_null | CHECK |
| job_alerts | 2200_17829_3_not_null | CHECK |
| mentee_profiles | 2200_17870_1_not_null | CHECK |
| mentee_profiles | 2200_17870_2_not_null | CHECK |
| mentees | 2200_17878_1_not_null | CHECK |
| mentors | 2200_17907_1_not_null | CHECK |
| system_alerts | 2200_21006_1_not_null | CHECK |
| system_alerts | 2200_21006_2_not_null | CHECK |
| system_alerts | 2200_21006_3_not_null | CHECK |
| system_alerts | 2200_21006_4_not_null | CHECK |
| mentorship_appointments | 2200_17918_1_not_null | CHECK |
| mentorship_appointments | 2200_17918_4_not_null | CHECK |
| mentorship_programs | 2200_17929_1_not_null | CHECK |
| mentorship_programs | 2200_17929_2_not_null | CHECK |
| messages | 2200_17957_1_not_null | CHECK |
| messages | 2200_17957_2_not_null | CHECK |
| messages | 2200_17957_3_not_null | CHECK |
| messages | 2200_17957_4_not_null | CHECK |
| messages | 2200_17957_5_not_null | CHECK |
| notifications | 2200_17976_1_not_null | CHECK |
| notifications | 2200_17976_2_not_null | CHECK |
| notifications | 2200_17976_3_not_null | CHECK |
| notifications | 2200_17976_4_not_null | CHECK |
| system_analytics | 2200_18017_1_not_null | CHECK |
| system_analytics | 2200_18017_2_not_null | CHECK |
| user_roles | 2200_18039_1_not_null | CHECK |
| user_roles | 2200_18039_2_not_null | CHECK |
| user_roles | 2200_18039_3_not_null | CHECK |
| mentorships | 2200_19680_1_not_null | CHECK |
| mentorships | 2200_19680_2_not_null | CHECK |
| mentorships | 2200_19680_3_not_null | CHECK |
| mentorships | 2200_19680_4_not_null | CHECK |
| mentorships | 2200_19680_5_not_null | CHECK |
| admin_actions | 2200_20991_1_not_null | CHECK |
| admin_actions | 2200_20991_3_not_null | CHECK |
| admin_actions | 2200_20991_4_not_null | CHECK |
| resources | 2200_19730_1_not_null | CHECK |
| resources | 2200_19730_2_not_null | CHECK |
| resources | 2200_19730_3_not_null | CHECK |
| resources | 2200_19730_6_not_null | CHECK |
| resources | 2200_19730_8_not_null | CHECK |
| event_rsvps | 2200_19275_1_not_null | CHECK |
| event_rsvps | 2200_19275_2_not_null | CHECK |
| event_rsvps | 2200_19275_3_not_null | CHECK |
| event_rsvps | 2200_19275_4_not_null | CHECK |
| job_bookmarks | 2200_19478_1_not_null | CHECK |
| job_bookmarks | 2200_19478_2_not_null | CHECK |
| job_bookmarks | 2200_19478_3_not_null | CHECK |
| job_bookmarks | 2200_19478_4_not_null | CHECK |
| content_moderation | 2200_21022_1_not_null | CHECK |
| content_moderation | 2200_21022_2_not_null | CHECK |
| content_moderation | 2200_21022_3_not_null | CHECK |
| content_moderation | 2200_21022_5_not_null | CHECK |
| networking_groups | 2200_22255_1_not_null | CHECK |
| networking_groups | 2200_22255_2_not_null | CHECK |
| networking_group_members | 2200_22265_1_not_null | CHECK |
| table_name | trigger_name | action_timing | event | action_statement |
| ------------------------ | -------------------------------------------- | ------------- | ------ | ------------------------------------------------------ |
| messages | on_new_message | AFTER | INSERT | EXECUTE FUNCTION update_conversation_updated_at() |
| messages | on_new_message_update_conversation_timestamp | AFTER | INSERT | EXECUTE FUNCTION update_conversation_last_message_at() |
| profiles | update_full_name_trigger | BEFORE | INSERT | EXECUTE FUNCTION update_full_name() |
| profiles | update_profiles_full_name | BEFORE | INSERT | EXECUTE FUNCTION update_full_name() |
| achievements | update_achievements_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at() |
| companies | handle_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION moddatetime('updated_at') |
| connections | handle_updated_at_connections | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at() |
| group_posts | on_group_posts_update | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at() |
| event_attendees | handle_event_attendees_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at() |
| event_attendees | update_event_attendees_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at() |
| events | handle_updated_at_events | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at() |
| events | update_events_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| groups | on_groups_update | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at() |
| job_applications | update_job_applications_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at() |
| job_listings | update_job_listings_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| jobs | handle_updated_at_jobs | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at() |
| mentee_profiles | on_mentee_profiles_updated | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at() |
| mentees | update_mentees_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| mentor_availability | update_mentor_availability_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| mentor_profiles | update_mentor_profiles_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| mentorship_appointments | update_mentorship_appointments_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| mentors | handle_updated_at_mentors | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at() |
| mentors | update_mentors_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| mentorship_programs | update_mentorship_programs_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at() |
| mentorship_relationships | update_mentorship_relationships_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at() |
| mentorship_requests | handle_updated_at_mentorship_requests | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at() |
| profiles | handle_updated_at_profiles | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at() |
| profiles | update_full_name_trigger | BEFORE | UPDATE | EXECUTE FUNCTION update_full_name() |
| profiles | update_profiles_full_name | BEFORE | UPDATE | EXECUTE FUNCTION update_full_name() |
| profiles | update_profiles_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| routine_name | routine_definition |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| get_dashboard_stats |
DECLARE
result JSONB;
total_users INTEGER;
active_jobs INTEGER;
pending_applications INTEGER;
total_applications INTEGER;
messages_today INTEGER;
users_by_role JSONB;
recent_activity JSONB;
pending_approvals INTEGER;
system_health JSONB;
BEGIN
-- Check if user is admin
IF NOT EXISTS (
SELECT 1 FROM profiles
WHERE id = auth.uid()
AND role IN ('admin', 'super_admin')
) THEN
RAISE EXCEPTION 'Access denied. Admin privileges required.';
END IF;
-- Get total users
SELECT COUNT(*) INTO total_users FROM profiles;
-- Get active jobs
SELECT COUNT(*) INTO active_jobs
FROM jobs
WHERE is_active = true;
-- Get pending applications
SELECT COUNT(*) INTO pending_applications
FROM job_applications
WHERE status = 'pending';
-- Get total applications
SELECT COUNT(*) INTO total_applications FROM job_applications;
-- Get messages today
SELECT COUNT(*) INTO messages_today
FROM messages
WHERE created_at >= CURRENT_DATE;
-- Get users by role
SELECT jsonb_object_agg(
COALESCE(role, 'unassigned'),
role_count
) INTO users_by_role
FROM (
SELECT
role,
COUNT(*) as role_count
FROM profiles
GROUP BY role
) role_stats;
-- Get recent activity (last 10 admin actions)
SELECT jsonb_agg(
jsonb_build_object(
'id', id,
'description', description,
'activityType', action_type,
'createdAt', created_at
)
) INTO recent_activity
FROM (
SELECT * FROM admin_actions
ORDER BY created_at DESC
LIMIT 10
) recent;
-- Get pending approvals count
SELECT COUNT(*) INTO pending_approvals
FROM content_moderation
WHERE status = 'pending';
-- Build system health metrics
system_health := jsonb_build_object(
'databaseConnections', 1,
'storageUsage', 0,
'apiResponseTime', 0
);
-- Build final result
result := jsonb_build_object(
'totalUsers', total_users,
'activeJobs', active_jobs,
'pendingApplications', pending_applications,
'totalApplications', total_applications,
'messagesToday', messages_today,
'usersByRole', COALESCE(users_by_role, '{}'::jsonb),
'recentActivity', COALESCE(recent_activity, '[]'::jsonb),
'pendingApprovals', pending_approvals,
'systemHealth', system_health,
'lastUpdated', NOW()
);
RETURN result;
END;
|
| get_table_columns |
select
column_name::text,
data_type::text
from information_schema.columns
where table_schema = 'public'
and table_name = $1
order by ordinal_position;
|
| rsvp_to_event |
BEGIN
INSERT INTO event_rsvps (event_id, user_id, attendance_status)
VALUES (p_event_id, p_attendee_id, p_attendance_status_text)
ON CONFLICT (event_id, user_id) DO
UPDATE SET attendance_status = EXCLUDED.attendance_status;
END;
|
| create_notification |
DECLARE
new_notification_id UUID;
BEGIN
INSERT INTO public.notifications (profile_id, title, message, link)
VALUES (user_id, notification_title, notification_message, notification_link)
RETURNING id INTO new_notification_id;
RETURN new_notification_id;
END;
|
| check_user_role_bypass_rls |
DECLARE
has_role BOOLEAN;
BEGIN
SELECT EXISTS (
SELECT 1 FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.profile_id = profile_uuid AND r.name = role_name
) INTO has_role;
RETURN has_role;
END;
|
| create_group_and_add_admin |
DECLARE
new_group_id UUID;
creator_id UUID := auth.uid();
BEGIN
-- Insert the new group and get its ID
INSERT INTO public.groups (name, description, is_private, tags, created_by)
VALUES (group_name, group_description, group_is_private, group_tags, creator_id)
RETURNING id INTO new_group_id;
-- Add the creator as the first member with an 'admin' role
INSERT INTO public.group_members (group_id, user_id, role)
VALUES (new_group_id, creator_id, 'admin');
RETURN new_group_id;
END;
|
| create_new_event |
SELECT public.create_event_with_agenda(event_data);
|
| drop_all_policies |
DECLARE
policy_record record;
BEGIN
FOR policy_record IN
SELECT policyname
FROM pg_policies
WHERE schemaname = 'public' AND tablename = target_table
LOOP
EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, target_table);
END LOOP;
END;
|
| auto_confirm_email |
BEGIN
-- Set the email_confirmed_at timestamp to now for new users
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE id = NEW.id AND email_confirmed_at IS NULL;
RETURN NEW;
END;
|
| get_roles |
BEGIN
RETURN QUERY SELECT r.id, r.name, r.description FROM roles r;
END;
|
| get_role_id_by_name |
DECLARE
role_id UUID;
BEGIN
SELECT id INTO role_id FROM roles WHERE name = role_name;
RETURN role_id;
END;
|
| get_unread_message_count |
DECLARE
count_val INTEGER;
BEGIN
SELECT COUNT(*)::INTEGER INTO count_val
FROM messages
WHERE conversation_id = conv_id
AND sender_id != user_id
AND read_at IS NULL;
RETURN count_val;
END;
|
| get_unread_notifications_count |
DECLARE
count INTEGER;
BEGIN
SELECT COUNT(*) INTO count
FROM public.notifications
WHERE profile_id = profile_uuid AND is_read = FALSE;
RETURN count;
END;
|
| get_role_by_name |
BEGIN
RETURN QUERY SELECT r.id, r.name, r.description FROM roles r WHERE r.name = role_name;
END;
|
| get_user_roles_bypass_rls |
BEGIN
RETURN QUERY
SELECT r.name, r.description
FROM roles r
JOIN user_roles ur ON r.id = ur.role_id
WHERE ur.profile_id = profile_uuid;
END;
|
| get_user_permissions_bypass_rls |
BEGIN
RETURN QUERY
SELECT DISTINCT p.name, p.description
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN user_roles ur ON rp.role_id = ur.role_id
WHERE ur.profile_id = profile_uuid;
END;
|
| is_conversation_participant |
BEGIN
-- This function runs with the permissions of the user who defined it (the owner),
-- bypassing the RLS policies of the calling user. This breaks the recursion.
RETURN EXISTS (
SELECT 1
FROM public.conversation_participants
WHERE conversation_id = p_conversation_id AND user_id = p_user_id
);
END;
|
| get_user_role |
DECLARE
user_role TEXT;
BEGIN
SELECT primary_role INTO user_role FROM public.profiles WHERE id = p_user_id;
RETURN user_role;
END;
|
| handle_updated_at |
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
|
| handle_new_user |
BEGIN
-- Insert the new profile
INSERT INTO public.profiles (id, email)
VALUES (NEW.id, NEW.email);
-- Return the NEW record
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN
-- Log the error but still return NEW to allow user creation
RAISE WARNING 'Error in handle_new_user function: %', SQLERRM;
RETURN NEW;
END;
|
| list_tables |
select table_name
from information_schema.tables
where table_schema = 'public'
and table_type = 'BASE TABLE';
|
| is_member_of_group |
BEGIN
RETURN EXISTS (
SELECT 1
FROM public.group_members
WHERE group_id = p_group_id AND user_id = auth.uid()
);
END;
|
| mark_notification_as_read |
DECLARE
success BOOLEAN;
BEGIN
UPDATE public.notifications
SET is_read = TRUE, updated_at = NOW()
WHERE id = notification_uuid AND profile_id = auth.uid();
GET DIAGNOSTICS success = ROW_COUNT;
RETURN success > 0;
END;
|
| mark_conversation_as_read |
BEGIN
UPDATE messages
SET is_read = TRUE
WHERE
conversation_id = p_conversation_id
AND sender_id != p_user_id
AND is_read = FALSE;
END;
|
| get_user_permissions |
BEGIN
RETURN QUERY
SELECT permissions.name, permissions.description
FROM permissions
WHERE permissions.id IN (
SELECT permission_id
FROM role_permissions
WHERE role_permissions.role_id IN (
SELECT role_id
FROM user_roles
WHERE user_roles.profile_id = profile_uuid
)
);
END;
|
| update_conversation_last_message_timestamp |
BEGIN
-- Update the conversation's last_message_at timestamp if conversation_id is not null
IF NEW.conversation_id IS NOT NULL THEN
UPDATE public.conversations
SET last_message_at = NEW.created_at
WHERE id = NEW.conversation_id;
END IF;
RETURN NEW;
END;
|
| update_conversation_last_message_at |
BEGIN
UPDATE public.conversations
SET last_message_at = NOW()
WHERE id = NEW.conversation_id;
RETURN NEW;
END;
|
| update_updated_at |
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
|
| update_conversation_updated_at |
BEGIN
UPDATE public.conversations
SET updated_at = now()
WHERE id = NEW.conversation_id;
RETURN NEW;
END;
|
| update_event_status_rpc |
SELECT public.update_event_published_status(event_id, new_status);
|
| user_has_permission |
DECLARE
has_permission BOOLEAN;
BEGIN
SELECT EXISTS (
SELECT 1
FROM permissions
WHERE permissions.name = permission_name
AND permissions.id IN (
SELECT permission_id
FROM role_permissions
WHERE role_permissions.role_id IN (
SELECT role_id
FROM user_roles
WHERE user_roles.profile_id = profile_uuid
)
)
) INTO has_permission;
RETURN has_permission;
END;
|
| update_updated_at_column |
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
|
| user_has_role |
DECLARE
has_role BOOLEAN;
BEGIN
SELECT EXISTS (
SELECT 1
FROM roles
WHERE roles.name = role_name
AND roles.id IN (
SELECT role_id
FROM user_roles
WHERE user_roles.profile_id = profile_uuid
)
) INTO has_role;
RETURN has_role;
END;
|
| remove_user_role |
DECLARE
role_id UUID;
BEGIN
-- Get role ID
SELECT id INTO role_id FROM roles WHERE name = role_name;
-- Check if role exists
IF role_id IS NULL THEN
RETURN FALSE;
END IF;
-- Remove role from user
DELETE FROM user_roles
WHERE profile_id = profile_uuid AND role_id = role_id;
RETURN TRUE;
END;
|
| remove_role_bypass_rls |
DECLARE
role_id_val UUID;
BEGIN
-- Get role ID with fully qualified column names
SELECT roles.id INTO role_id_val FROM roles WHERE roles.name = role_name;
-- Check if role exists
IF role_id_val IS NULL THEN
RETURN FALSE;
END IF;
-- Remove role from user with fully qualified column names
DELETE FROM user_roles
WHERE user_roles.profile_id = profile_uuid AND user_roles.role_id = role_id_val;
RETURN TRUE;
END;
|
| update_full_name |
BEGIN
NEW.full_name = TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
RETURN NEW;
END;
|
| assign_user_role |
DECLARE
role_id UUID;
BEGIN
-- Get role ID
SELECT id INTO role_id FROM roles WHERE name = role_name;
-- Check if role exists
IF role_id IS NULL THEN
RETURN FALSE;
END IF;
-- Assign role to user
INSERT INTO user_roles (profile_id, role_id)
VALUES (profile_uuid, role_id)
ON CONFLICT (profile_id, role_id) DO NOTHING;
RETURN TRUE;
END;
|
| check_user_permission_bypass_rls |
DECLARE
has_permission BOOLEAN;
BEGIN
SELECT EXISTS (
SELECT 1 FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN user_roles ur ON rp.role_id = ur.role_id
WHERE ur.profile_id = profile_uuid AND p.name = permission_name
) INTO has_permission;
RETURN has_permission;
END;
|
| assign_role_bypass_rls |
DECLARE
role_id_val UUID;
BEGIN
-- Get role ID with fully qualified column names
SELECT roles.id INTO role_id_val FROM roles WHERE roles.name = role_name;
-- Check if role exists
IF role_id_val IS NULL THEN
RETURN FALSE;
END IF;
-- Assign role to user with fully qualified column names
INSERT INTO user_roles (profile_id, role_id)
VALUES (profile_uuid, role_id_val)
ON CONFLICT (profile_id, role_id) DO NOTHING;
RETURN TRUE;
END;
|
| create_event_with_agenda |
DECLARE
new_event_id UUID;
result JSONB;
BEGIN
-- First insert the event without the agenda
INSERT INTO public.events (
title,
description,
start_date,
end_date,
location,
is_virtual,
creator_id,
organizer_id,
is_published,
created_at,
updated_at
) VALUES (
event_data->>'title',
event_data->>'description',
(event_data->>'start_date')::TIMESTAMP WITH TIME ZONE,
(event_data->>'end_date')::TIMESTAMP WITH TIME ZONE,
event_data->>'location',
(event_data->>'is_virtual')::BOOLEAN,
(event_data->>'creator_id')::UUID,
(event_data->>'creator_id')::UUID,
(event_data->>'is_published')::BOOLEAN,
COALESCE((event_data->>'created_at')::TIMESTAMP WITH TIME ZONE, now()),
now()
) RETURNING id INTO new_event_id;
-- Then update the agenda separately
IF event_data->>'agenda' IS NOT NULL THEN
UPDATE public.events
SET agenda = event_data->>'agenda'
WHERE id = new_event_id;
END IF;
-- Add other optional fields if present
IF event_data->>'cost' IS NOT NULL THEN
UPDATE public.events
SET cost = event_data->>'cost'
WHERE id = new_event_id;
END IF;
IF event_data->>'sponsors' IS NOT NULL THEN
UPDATE public.events
SET sponsors = event_data->>'sponsors'
WHERE id = new_event_id;
END IF;
IF event_data->>'virtual_meeting_link' IS NOT NULL THEN
UPDATE public.events
SET virtual_meeting_link = event_data->>'virtual_meeting_link'
WHERE id = new_event_id;
END IF;
IF event_data->>'event_type' IS NOT NULL THEN
UPDATE public.events
SET event_type = event_data->>'event_type'
WHERE id = new_event_id;
END IF;
IF event_data->>'max_attendees' IS NOT NULL THEN
UPDATE public.events
SET max_attendees = (event_data->>'max_attendees')::INTEGER
WHERE id = new_event_id;
END IF;
IF event_data->>'registration_deadline' IS NOT NULL THEN
UPDATE public.events
SET registration_deadline = (event_data->>'registration_deadline')::TIMESTAMP WITH TIME ZONE
WHERE id = new_event_id;
END IF;
IF event_data->>'image_url' IS NOT NULL THEN
UPDATE public.events
SET featured_image_url = event_data->>'image_url'
WHERE id = new_event_id;
END IF;
-- Return the created event
SELECT row_to_json(e)::jsonb INTO result
FROM public.events e
WHERE id = new_event_id;
RETURN result;
END;
|
| get_or_create_conversation |
DECLARE
conversation_id UUID;
BEGIN
-- Check if conversation exists
SELECT id INTO conversation_id
FROM conversations
WHERE (participant_1 = user1_id AND participant_2 = user2_id)
OR (participant_1 = user2_id AND participant_2 = user1_id);
-- If not exists, create it
IF conversation_id IS NULL THEN
INSERT INTO conversations(participant_1, participant_2, last_message_at)
VALUES (user1_id, user2_id, NOW())
RETURNING id INTO conversation_id;
END IF;
RETURN conversation_id;
END;
|
| find_or_create_conversation |
DECLARE
v_conversation_id UUID;
v_current_user_id UUID := auth.uid();
BEGIN
IF v_current_user_id = other_user_id THEN
RETURN NULL;
END IF;
SELECT cp1.conversation_id INTO v_conversation_id
FROM conversation_participants AS cp1
JOIN conversation_participants AS cp2 ON cp1.conversation_id = cp2.conversation_id
WHERE cp1.user_id = v_current_user_id AND cp2.user_id = other_user_id
AND (
SELECT COUNT(*)
FROM conversation_participants
WHERE conversation_id = cp1.conversation_id
) = 2
LIMIT 1;
IF v_conversation_id IS NOT NULL THEN
RETURN v_conversation_id;
END IF;
INSERT INTO conversations DEFAULT VALUES
RETURNING id INTO v_conversation_id;
INSERT INTO conversation_participants (conversation_id, user_id)
VALUES (v_conversation_id, v_current_user_id), (v_conversation_id, other_user_id);
RETURN v_conversation_id;
END;
|
| get_latest_message |
BEGIN
RETURN QUERY
SELECT
m.id AS message_id,
m.content,
m.sender_id,
p.full_name AS sender_name,
m.created_at,
m.message_type,
m.attachment_url
FROM
messages m
JOIN profiles p ON m.sender_id = p.id
WHERE
m.conversation_id = p_conversation_id
ORDER BY
m.created_at DESC
LIMIT 1;
END;
|
| get_user_conversations |
BEGIN
RETURN QUERY
WITH user_conversations AS (
-- Get all conversations the current user is a part of
SELECT cp.conversation_id
FROM public.conversation_participants cp
WHERE cp.user_id = auth.uid()
),
conversation_participants_details AS (
-- Get details of all participants in those conversations, excluding the current user
SELECT
cp.conversation_id,
jsonb_agg(jsonb_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url)) AS participants
FROM public.conversation_participants cp
JOIN public.profiles p ON cp.user_id = p.id
WHERE cp.conversation_id IN (SELECT uc.conversation_id FROM user_conversations)
AND cp.user_id <> auth.uid()
GROUP BY cp.conversation_id
),
last_messages AS (
-- Get the last message for each conversation using a window function
SELECT
m.conversation_id,
m.content,
m.created_at
FROM (
SELECT
m.conversation_id,
m.content,
m.created_at,
ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
FROM public.messages m
WHERE m.conversation_id IN (SELECT uc.conversation_id FROM user_conversations)
) m
WHERE m.rn = 1
)
-- Final SELECT to join everything together
SELECT
c.id AS conversation_id,
c.updated_at AS last_updated,
cpd.participants,
lm.content AS last_message_content,
lm.created_at AS last_message_created_at
FROM public.conversations c
JOIN user_conversations uc ON c.id = uc.conversation_id
LEFT JOIN conversation_participants_details cpd ON c.id = cpd.conversation_id
LEFT JOIN last_messages lm ON c.id = lm.conversation_id
ORDER BY c.updated_at DESC;
END;
|
| get_user_conversations_v2 |
BEGIN
RETURN QUERY
WITH user_conversations AS (
SELECT cp.conversation_id
FROM conversation_participants cp
WHERE cp.user_id = p_user_id
)
SELECT
c.id,
c.last_message_at,
c.created_at,
other_participant.user_id,
p.full_name,
p.avatar_url,
COALESCE(p.is_online, FALSE),
(
SELECT COUNT(*)
FROM public.messages m
WHERE m.conversation_id = c.id
AND m.sender_id != p_user_id
AND m.read_at IS NULL
) AS unread_count
FROM conversations c
JOIN user_conversations uc ON c.id = uc.conversation_id
JOIN conversation_participants other_participant ON c.id = other_participant.conversation_id AND other_participant.user_id != p_user_id
JOIN profiles p ON other_participant.user_id = p.id
ORDER BY c.last_message_at DESC;
END;
|
| moddatetime | null |
| notify_new_message |
DECLARE
participant_1_id UUID;
participant_2_id UUID;
BEGIN
-- Get the conversation participants
SELECT participant_1, participant_2 INTO participant_1_id, participant_2_id
FROM public.conversations
WHERE id = NEW.conversation_id;
-- Update unread count for the other participant (not the sender)
-- This is used for notification badges
IF participant_1_id = NEW.sender_id THEN
-- Sender is participant 1, notify participant 2
PERFORM pg_notify(
'new_message',
json_build_object(
'user_id', participant_2_id,
'conversation_id', NEW.conversation_id,
'sender_id', NEW.sender_id,
'message_id', NEW.id
)::text
);
ELSE
-- Sender is participant 2, notify participant 1
PERFORM pg_notify(
'new_message',
json_build_object(
'user_id', participant_1_id,
'conversation_id', NEW.conversation_id,
'sender_id', NEW.sender_id,
'message_id', NEW.id
)::text
);
END IF;
RETURN NEW;
END;
|
| update_event_published_status |
DECLARE
is_published_value BOOLEAN;
result JSONB;
BEGIN
-- Convert status string to boolean is_published value
IF status_value = 'published' THEN
is_published_value := TRUE;
ELSE
is_published_value := FALSE;
END IF;
-- Update the event status
UPDATE public.events
SET
is_published = is_published_value,
updated_at = now()
WHERE id = event_id;
-- Return the updated event
SELECT row_to_json(e)::jsonb INTO result
FROM public.events e
WHERE id = event_id;
RETURN result;
END;
|
| get_connections_count |
DECLARE
connection_count INTEGER;
BEGIN
-- Count connections where the user is either the requester or recipient
-- and the connection status is 'accepted'
SELECT COUNT(*) INTO connection_count
FROM public.connections
WHERE (requester_id = p_user_id OR recipient_id = p_user_id)
AND status = 'accepted';
RETURN connection_count;
END;
|
| get_my_role |
BEGIN
-- Important: This function assumes the 'profiles' table and 'role' column exist.
-- It fetches the role for the currently authenticated user.
RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
|| table_name | view_definition |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| event_stats | SELECT e.id AS event_id,
e.title,
e.start_date,
e.end_date,
e.venue AS location,
e.is_virtual,
e.category,
e.is_featured,
e.is_published,
e.max_attendees,
e.organizer_id,
p.full_name AS organizer_name,
count(ea.id) AS attendee_count,
CASE
WHEN (e.max_attendees IS NOT NULL) THEN GREATEST((0)::bigint, (e.max_attendees - count(ea.id)))
ELSE NULL::bigint
END AS spots_remaining
FROM ((events e
LEFT JOIN event_attendees ea ON ((e.id = ea.event_id)))
LEFT JOIN profiles p ON ((e.organizer_id = p.id)))
GROUP BY e.id, p.full_name; |
| event_attendees_with_profiles | SELECT ea.id,
ea.created_at,
ea.event_id,
ea.user_id,
ea.attendance_status AS status,
ea.check_in_time,
p.id AS profile_id,
p.full_name,
p.avatar_url,
e.title AS event_title,
e.start_date AS event_start_date
FROM ((event_attendees ea
JOIN profiles p ON ((ea.user_id = p.id)))
JOIN events e ON ((ea.event_id = e.id))); |
| detailed_event_feedback | SELECT ef.id AS feedback_id,
ef.rating,
ef.comments,
ef.submitted_at AS feedback_submitted_at,
ef.event_id,
e.title AS event_title,
ef.user_id,
p.full_name,
p.avatar_url
FROM ((event_feedback ef
JOIN events e ON ((ef.event_id = e.id)))
JOIN profiles p ON ((ef.user_id = p.id))); |
| table_name | indexname | indexdef |
| ------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| group_posts | group_posts_pkey | CREATE UNIQUE INDEX group_posts_pkey ON public.group_posts USING btree (id) |
| connections | connections_pkey | CREATE UNIQUE INDEX connections_pkey ON public.connections USING btree (id) |
| connections | connections_requester_id_recipient_id_key | CREATE UNIQUE INDEX connections_requester_id_recipient_id_key ON public.connections USING btree (requester_id, recipient_id) |
| connections | idx_connections_recipient_id | CREATE INDEX idx_connections_recipient_id ON public.connections USING btree (recipient_id) |
| connections | idx_connections_requester_id | CREATE INDEX idx_connections_requester_id ON public.connections USING btree (requester_id) |
| connections | idx_connections_status | CREATE INDEX idx_connections_status ON public.connections USING btree (status) |
| events | events_pkey | CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id) |
| events | events_slug_unique | CREATE UNIQUE INDEX events_slug_unique ON public.events USING btree (slug) |
| events | events_category_idx | CREATE INDEX events_category_idx ON public.events USING btree (category) |
| events | events_is_featured_idx | CREATE INDEX events_is_featured_idx ON public.events USING btree (is_featured) |
| events | events_is_published_idx | CREATE INDEX events_is_published_idx ON public.events USING btree (is_published) |
| events | events_organizer_id_idx | CREATE INDEX events_organizer_id_idx ON public.events USING btree (organizer_id) |
| events | events_start_date_idx | CREATE INDEX events_start_date_idx ON public.events USING btree (start_date) |
| events | idx_events_category | CREATE INDEX idx_events_category ON public.events USING btree (category) |
| events | idx_events_event_type | CREATE INDEX idx_events_event_type ON public.events USING btree (event_type) |
| events | idx_events_is_published | CREATE INDEX idx_events_is_published ON public.events USING btree (is_published) |
| events | idx_events_organizer_id | CREATE INDEX idx_events_organizer_id ON public.events USING btree (organizer_id) |
| events | idx_events_start_date | CREATE INDEX idx_events_start_date ON public.events USING btree (start_date) |
| conversations | conversations_pkey | CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id) |
| conversation_participants | conversation_participants_pkey | CREATE UNIQUE INDEX conversation_participants_pkey ON public.conversation_participants USING btree (conversation_id, user_id) |
| conversation_participants | idx_conversation_participants_conversation_id | CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants USING btree (conversation_id) |
| conversation_participants | idx_conversation_participants_user_id | CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants USING btree (user_id) |
| bookmarked_jobs | bookmarked_jobs_pkey | CREATE UNIQUE INDEX bookmarked_jobs_pkey ON public.bookmarked_jobs USING btree (id) |
| bookmarked_jobs | unique_user_job_bookmark | CREATE UNIQUE INDEX unique_user_job_bookmark ON public.bookmarked_jobs USING btree (user_id, job_id) |
| achievements | achievements_pkey | CREATE UNIQUE INDEX achievements_pkey ON public.achievements USING btree (id) |
| education_history | education_history_pkey | CREATE UNIQUE INDEX education_history_pkey ON public.education_history USING btree (id) |
| event_feedback | event_feedback_event_id_user_id_key | CREATE UNIQUE INDEX event_feedback_event_id_user_id_key ON public.event_feedback USING btree (event_id, user_id) |
| event_feedback | event_feedback_pkey | CREATE UNIQUE INDEX event_feedback_pkey ON public.event_feedback USING btree (id) |
| jobs | jobs_pkey | CREATE UNIQUE INDEX jobs_pkey ON public.jobs USING btree (id) |
| jobs | idx_jobs_company_id | CREATE INDEX idx_jobs_company_id ON public.jobs USING btree (company_id) |
| jobs | idx_jobs_is_active | CREATE INDEX idx_jobs_is_active ON public.jobs USING btree (is_active) |
| jobs | idx_jobs_job_type | CREATE INDEX idx_jobs_job_type ON public.jobs USING btree (job_type) |
| jobs | idx_jobs_posted_by | CREATE INDEX idx_jobs_posted_by ON public.jobs USING btree (posted_by) |
| mentor_availability | mentor_availability_pkey | CREATE UNIQUE INDEX mentor_availability_pkey ON public.mentor_availability USING btree (id) |
| mentor_availability | mentor_availability_date_idx | CREATE INDEX mentor_availability_date_idx ON public.mentor_availability USING btree (date) |
| mentor_availability | mentor_availability_is_booked_idx | CREATE INDEX mentor_availability_is_booked_idx ON public.mentor_availability USING btree (is_booked) |
| mentor_availability | mentor_availability_mentor_id_idx | CREATE INDEX mentor_availability_mentor_id_idx ON public.mentor_availability USING btree (mentor_id) |
| job_applications | job_applications_job_id_applicant_id_key | CREATE UNIQUE INDEX job_applications_job_id_applicant_id_key ON public.job_applications USING btree (job_id, applicant_id) |
| job_applications | job_applications_pkey | CREATE UNIQUE INDEX job_applications_pkey ON public.job_applications USING btree (id) |
| job_applications | idx_job_applications_applicant_id | CREATE INDEX idx_job_applications_applicant_id ON public.job_applications USING btree (applicant_id) |
| job_applications | idx_job_applications_job_id | CREATE INDEX idx_job_applications_job_id ON public.job_applications USING btree (job_id) |
| job_listings | job_listings_pkey | CREATE UNIQUE INDEX job_listings_pkey ON public.job_listings USING btree (id) |
| groups | groups_pkey | CREATE UNIQUE INDEX groups_pkey ON public.groups USING btree (id) |
| mentor_profiles | mentor_profiles_pkey | CREATE UNIQUE INDEX mentor_profiles_pkey ON public.mentor_profiles USING btree (id) |
| roles | roles_name_key | CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name) |
| roles | roles_pkey | CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id) |
| user_resumes | user_resumes_pkey | CREATE UNIQUE INDEX user_resumes_pkey ON public.user_resumes USING btree (id) |
| mentorship_requests | mentorship_requests_mentee_id_mentor_id_key | CREATE UNIQUE INDEX mentorship_requests_mentee_id_mentor_id_key ON public.mentorship_requests USING btree (mentee_id, mentor_id) |
| mentorship_requests | mentorship_requests_pkey | CREATE UNIQUE INDEX mentorship_requests_pkey ON public.mentorship_requests USING btree (id) |
| mentorship_requests | idx_mentorship_requests_mentee_id | CREATE INDEX idx_mentorship_requests_mentee_id ON public.mentorship_requests USING btree (mentee_id) |
| mentorship_requests | idx_mentorship_requests_mentor_id | CREATE INDEX idx_mentorship_requests_mentor_id ON public.mentorship_requests USING btree (mentor_id) |
| mentorship_requests | idx_mentorship_requests_status | CREATE INDEX idx_mentorship_requests_status ON public.mentorship_requests USING btree (status) |
| permissions | permissions_name_key | CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name) |
| permissions | permissions_pkey | CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id) |
| user_activity_logs | user_activity_logs_pkey | CREATE UNIQUE INDEX user_activity_logs_pkey ON public.user_activity_logs USING btree (id) |
| resume_profiles | resume_profiles_pkey | CREATE UNIQUE INDEX resume_profiles_pkey ON public.resume_profiles USING btree (id) |
| notification_preferences | notification_preferences_pkey | CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (id) |
| notification_preferences | notification_preferences_user_id_notification_type_key | CREATE UNIQUE INDEX notification_preferences_user_id_notification_type_key ON public.notification_preferences USING btree (user_id, notification_type) |
| role_permissions | role_permissions_pkey | CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (role_id, permission_id) |
| mentorship_relationships | mentorship_relationships_mentor_id_mentee_id_program_id_key | CREATE UNIQUE INDEX mentorship_relationships_mentor_id_mentee_id_program_id_key ON public.mentorship_relationships USING btree (mentor_id, mentee_id, program_id) |
| mentorship_relationships | mentorship_relationships_pkey | CREATE UNIQUE INDEX mentorship_relationships_pkey ON public.mentorship_relationships USING btree (id) |
| profiles | profiles_email_key | CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email) |
| profiles | profiles_pkey | CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id) |
| profiles | idx_profiles_graduation_year | CREATE INDEX idx_profiles_graduation_year ON public.profiles USING btree (graduation_year) |
| profiles | idx_profiles_is_mentor | CREATE INDEX idx_profiles_is_mentor ON public.profiles USING btree (is_mentor) |
| profiles | idx_profiles_location | CREATE INDEX idx_profiles_location ON public.profiles USING btree (location) |
| profiles | idx_profiles_major | CREATE INDEX idx_profiles_major ON public.profiles USING btree (major) |
| event_attendees | event_attendees_event_id_user_id_key | CREATE UNIQUE INDEX event_attendees_event_id_user_id_key ON public.event_attendees USING btree (event_id, user_id) |
| event_attendees | event_attendees_pkey | CREATE UNIQUE INDEX event_attendees_pkey ON public.event_attendees USING btree (id) |
| event_attendees | event_attendees_event_id_idx | CREATE INDEX event_attendees_event_id_idx ON public.event_attendees USING btree (event_id) |
| event_attendees | event_attendees_status_idx | CREATE INDEX event_attendees_status_idx ON public.event_attendees USING btree (attendance_status) |
| event_attendees | event_attendees_user_id_idx | CREATE INDEX event_attendees_user_id_idx ON public.event_attendees USING btree (user_id) |
| event_attendees | idx_event_attendees_attendee | CREATE INDEX idx_event_attendees_attendee ON public.event_attendees USING btree (user_id) |
| event_attendees | idx_event_attendees_event_id | CREATE INDEX idx_event_attendees_event_id ON public.event_attendees USING btree (event_id) |
| event_attendees | event_attendees_event_id_attendee_id_key | CREATE UNIQUE INDEX event_attendees_event_id_attendee_id_key ON public.event_attendees USING btree (event_id, attendee_id) |
| group_members | group_members_pkey | CREATE UNIQUE INDEX group_members_pkey ON public.group_members USING btree (group_id, user_id) |
| activity_logs | activity_logs_pkey | CREATE UNIQUE INDEX activity_logs_pkey ON public.activity_logs USING btree (id) |
| content_approvals | content_approvals_pkey | CREATE UNIQUE INDEX content_approvals_pkey ON public.content_approvals USING btree (id) |
| content_approvals | idx_content_approvals_creator_id | CREATE INDEX idx_content_approvals_creator_id ON public.content_approvals USING btree (creator_id) |
| content_approvals | idx_content_approvals_status | CREATE INDEX idx_content_approvals_status ON public.content_approvals USING btree (status) |
| companies | companies_name_key | CREATE UNIQUE INDEX companies_name_key ON public.companies USING btree (name) |
| companies | companies_pkey | CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id) |
| job_alerts | job_alerts_pkey | CREATE UNIQUE INDEX job_alerts_pkey ON public.job_alerts USING btree (id) |
| mentee_profiles | mentee_profiles_pkey | CREATE UNIQUE INDEX mentee_profiles_pkey ON public.mentee_profiles USING btree (id) |
| mentee_profiles | user_id_unique_mentee_profile | CREATE UNIQUE INDEX user_id_unique_mentee_profile ON public.mentee_profiles USING btree (user_id) |
| messages | messages_pkey | CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id) |
| messages | idx_messages_on_conversation_id | CREATE INDEX idx_messages_on_conversation_id ON public.messages USING btree (conversation_id) |
| mentees | mentees_pkey | CREATE UNIQUE INDEX mentees_pkey ON public.mentees USING btree (id) |
| mentees | mentees_status_idx | CREATE INDEX mentees_status_idx ON public.mentees USING btree (status) |
| mentees | mentees_user_id_idx | CREATE INDEX mentees_user_id_idx ON public.mentees USING btree (user_id) |
| mentors | mentors_pkey | CREATE UNIQUE INDEX mentors_pkey ON public.mentors USING btree (id) |
| mentors | mentors_user_id_unique | CREATE UNIQUE INDEX mentors_user_id_unique ON public.mentors USING btree (user_id) |
| mentors | mentors_status_idx | CREATE INDEX mentors_status_idx ON public.mentors USING btree (status) |
| mentors | mentors_user_id_idx | CREATE INDEX mentors_user_id_idx ON public.mentors USING btree (user_id) |
| mentorship_appointments | mentorship_appointments_pkey | CREATE UNIQUE INDEX mentorship_appointments_pkey ON public.mentorship_appointments USING btree (id) |
| mentorship_appointments | mentorship_appointments_availability_id_idx | CREATE INDEX mentorship_appointments_availability_id_idx ON public.mentorship_appointments USING btree (availability_id) |
| mentorship_appointments | mentorship_appointments_created_at_idx | CREATE INDEX mentorship_appointments_created_at_idx ON public.mentorship_appointments USING btree (created_at) |
| mentorship_appointments | mentorship_appointments_mentee_id_idx | CREATE INDEX mentorship_appointments_mentee_id_idx ON public.mentorship_appointments USING btree (mentee_id) |
| mentorship_appointments | mentorship_appointments_status_idx | CREATE INDEX mentorship_appointments_status_idx ON public.mentorship_appointments USING btree (status) |
| mentorship_programs | mentorship_programs_pkey | CREATE UNIQUE INDEX mentorship_programs_pkey ON public.mentorship_programs USING btree (id) |
| notifications | notifications_pkey | CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id) |
| notifications | notifications_created_at_idx | CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at) |
| notifications | notifications_is_read_idx | CREATE INDEX notifications_is_read_idx ON public.notifications USING btree (is_read) |
| notifications | notifications_profile_id_idx | CREATE INDEX notifications_profile_id_idx ON public.notifications USING btree (profile_id) |
| system_analytics | system_analytics_pkey | CREATE UNIQUE INDEX system_analytics_pkey ON public.system_analytics USING btree (id) |
| user_roles | user_roles_pkey | CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id) |
| user_roles | user_roles_profile_id_role_id_key | CREATE UNIQUE INDEX user_roles_profile_id_role_id_key ON public.user_roles USING btree (profile_id, role_id) |
| mentorships | mentorships_pkey | CREATE UNIQUE INDEX mentorships_pkey ON public.mentorships USING btree (id) |
| mentorships | mentorships_mentor_id_mentee_id_key | CREATE UNIQUE INDEX mentorships_mentor_id_mentee_id_key ON public.mentorships USING btree (mentor_id, mentee_id) |
| admin_actions | admin_actions_pkey | CREATE UNIQUE INDEX admin_actions_pkey ON public.admin_actions USING btree (id) |
| admin_actions | idx_admin_actions_admin_id | CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions USING btree (admin_id) |
| admin_actions | idx_admin_actions_created_at | CREATE INDEX idx_admin_actions_created_at ON public.admin_actions USING btree (created_at DESC) |
| system_alerts | system_alerts_pkey | CREATE UNIQUE INDEX system_alerts_pkey ON public.system_alerts USING btree (id) |
| system_alerts | idx_system_alerts_created_at | CREATE INDEX idx_system_alerts_created_at ON public.system_alerts USING btree (created_at DESC) |
| system_alerts | idx_system_alerts_is_resolved | CREATE INDEX idx_system_alerts_is_resolved ON public.system_alerts USING btree (is_resolved) |
| resources | resources_pkey | CREATE UNIQUE INDEX resources_pkey ON public.resources USING btree (id) |
| job_bookmarks | job_bookmarks_pkey | CREATE UNIQUE INDEX job_bookmarks_pkey ON public.job_bookmarks USING btree (id) |
| job_bookmarks | job_bookmarks_job_id_user_id_key | CREATE UNIQUE INDEX job_bookmarks_job_id_user_id_key ON public.job_bookmarks USING btree (job_id, user_id) |
| event_rsvps | event_rsvps_pkey | CREATE UNIQUE INDEX event_rsvps_pkey ON public.event_rsvps USING btree (id) |
| event_rsvps | event_rsvps_event_id_user_id_key | CREATE UNIQUE INDEX event_rsvps_event_id_user_id_key ON public.event_rsvps USING btree (event_id, user_id) |
| content_moderation | content_moderation_pkey | CREATE UNIQUE INDEX content_moderation_pkey ON public.content_moderation USING btree (id) |
| content_moderation | idx_content_moderation_status | CREATE INDEX idx_content_moderation_status ON public.content_moderation USING btree (status) |
| content_moderation | idx_content_moderation_content_type | CREATE INDEX idx_content_moderation_content_type ON public.content_moderation USING btree (content_type) |
| networking_groups | networking_groups_pkey | CREATE UNIQUE INDEX networking_groups_pkey ON public.networking_groups USING btree (id) |
| networking_group_members | networking_group_members_pkey | CREATE UNIQUE INDEX networking_group_members_pkey ON public.networking_group_members USING btree (id) |
| networking_group_members | networking_group_members_group_id_user_id_key | CREATE UNIQUE INDEX networking_group_members_group_id_user_id_key ON public.networking_group_members USING btree (group_id, user_id) |
| table_name | column_name | data_type | is_nullable | column_default |
| ----------------------------- | ---------------------------------- | ------------------------ | ----------- | ---------------------------- |
| achievements | id | uuid | NO | gen_random_uuid() |
| achievements | profile_id | uuid | YES | null |
| achievements | title | text | NO | null |
| achievements | description | text | YES | null |
| achievements | year | integer | YES | null |
| achievements | url | text | YES | null |
| achievements | achievement_type | text | YES | null |
| achievements | created_at | timestamp with time zone | YES | now() |
| achievements | updated_at | timestamp with time zone | YES | now() |
| activity_logs | id | uuid | NO | uuid_generate_v4() |
| activity_logs | profile_id | uuid | YES | null |
| activity_logs | action | text | NO | null |
| activity_logs | entity_type | text | NO | null |
| activity_logs | entity_id | text | NO | null |
| activity_logs | details | jsonb | YES | null |
| activity_logs | created_at | timestamp with time zone | YES | now() |
| admin_actions | id | uuid | NO | gen_random_uuid() |
| admin_actions | admin_id | uuid | YES | null |
| admin_actions | action_type | text | NO | null |
| admin_actions | target_type | text | NO | null |
| admin_actions | target_id | uuid | YES | null |
| admin_actions | description | text | YES | null |
| admin_actions | metadata | jsonb | YES | '{}'::jsonb |
| admin_actions | created_at | timestamp with time zone | YES | now() |
| bookmarked_jobs | id | bigint | NO | null |
| bookmarked_jobs | user_id | uuid | NO | null |
| bookmarked_jobs | job_id | uuid | NO | null |
| bookmarked_jobs | created_at | timestamp with time zone | NO | now() |
| companies | id | uuid | NO | gen_random_uuid() |
| companies | name | text | NO | null |
| companies | logo_url | text | YES | null |
| companies | created_at | timestamp with time zone | NO | now() |
| companies | updated_at | timestamp with time zone | NO | now() |
| connections | id | uuid | NO | uuid_generate_v4() |
| connections | requester_id | uuid | YES | null |
| connections | recipient_id | uuid | YES | null |
| connections | status | text | YES | 'pending'::text |
| connections | created_at | timestamp with time zone | YES | timezone('utc'::text, now()) |
| connections | updated_at | timestamp with time zone | YES | timezone('utc'::text, now()) |
| content_approvals | id | bigint | NO | null |
| content_approvals | created_at | timestamp with time zone | YES | now() |
| content_approvals | content_type | text | NO | null |
| content_approvals | content_data | jsonb | YES | null |
| content_approvals | creator_id | uuid | NO | null |
| content_approvals | reviewer_id | uuid | YES | null |
| content_approvals | status | text | NO | 'pending'::text |
| content_approvals | reviewed_at | timestamp with time zone | YES | null |
| content_approvals | rejection_reason | text | YES | null |
| content_moderation | id | uuid | NO | gen_random_uuid() |
| content_moderation | content_type | text | NO | null |
| content_moderation | content_id | uuid | NO | null |
| content_moderation | moderator_id | uuid | YES | null |
| content_moderation | status | text | NO | 'pending'::text |
| content_moderation | review_notes | text | YES | null |
| content_moderation | reviewed_at | timestamp with time zone | YES | null |
| content_moderation | created_at | timestamp with time zone | YES | now() |
| conversation_participants | conversation_id | uuid | NO | null |
| conversation_participants | user_id | uuid | NO | null |
| conversation_participants | joined_at | timestamp with time zone | NO | now() |
| conversations | id | uuid | NO | gen_random_uuid() |
| conversations | created_at | timestamp with time zone | NO | now() |
| conversations | updated_at | timestamp with time zone | NO | now() |
| conversations | last_message_at | timestamp with time zone | YES | now() |
| detailed_event_feedback | feedback_id | uuid | YES | null |
| detailed_event_feedback | rating | integer | YES | null |
| detailed_event_feedback | comments | text | YES | null |
| detailed_event_feedback | feedback_submitted_at | timestamp with time zone | YES | null |
| detailed_event_feedback | event_id | uuid | YES | null |
| detailed_event_feedback | event_title | text | YES | null |
| detailed_event_feedback | user_id | uuid | YES | null |
| detailed_event_feedback | full_name | text | YES | null |
| detailed_event_feedback | avatar_url | text | YES | null |
| education_history | id | uuid | NO | gen_random_uuid() |
| education_history | user_id | uuid | YES | null |
| education_history | institution_name | text | NO | null |
| education_history | degree_type | text | NO | null |
| education_history | major | text | YES | null |
| education_history | graduation_year | integer | YES | null |
| education_history | gpa | numeric | YES | null |
| education_history | honors | text | YES | null |
| education_history | notable_achievements | text | YES | null |
| education_history | created_at | timestamp with time zone | YES | now() |
| event_attendees | id | uuid | NO | gen_random_uuid() |
| event_attendees | created_at | timestamp with time zone | NO | now() |
| event_attendees | updated_at | timestamp with time zone | YES | now() |
| event_attendees | event_id | uuid | NO | null |
| event_attendees | user_id | uuid | NO | null |
| event_attendees | attendance_status | text | NO | 'registered'::text |
| event_attendees | check_in_time | timestamp with time zone | YES | null |
| event_attendees | attendee_id | uuid | YES | null |
| event_attendees | registration_date | timestamp with time zone | YES | timezone('utc'::text, now()) |
| event_attendees_with_profiles | id | uuid | YES | null |
| event_attendees_with_profiles | created_at | timestamp with time zone | YES | null |
| event_attendees_with_profiles | event_id | uuid | YES | null |
| event_attendees_with_profiles | user_id | uuid | YES | null |
| event_attendees_with_profiles | status | text | YES | null |
| event_attendees_with_profiles | check_in_time | timestamp with time zone | YES | null |
| event_attendees_with_profiles | profile_id | uuid | YES | null |
| event_attendees_with_profiles | full_name | text | YES | null |
| event_attendees_with_profiles | avatar_url | text | YES | null |
| event_attendees_with_profiles | event_title | text | YES | null |
| event_attendees_with_profiles | event_start_date | timestamp with time zone | YES | null |
| event_feedback | id | uuid | NO | uuid_generate_v4() |
| event_feedback | event_id | uuid | YES | null |
| event_feedback | user_id | uuid | YES | null |
| event_feedback | rating | integer | YES | null |
| event_feedback | comments | text | YES | null |
| event_feedback | submitted_at | timestamp with time zone | YES | now() |
| event_feedback | created_at | timestamp with time zone | YES | timezone('utc'::text, now()) |
| event_feedback | comment | text | YES | null |
| event_feedback | rsvp_status | text | YES | null |
| event_rsvps | id | uuid | NO | gen_random_uuid() |
| event_rsvps | created_at | timestamp with time zone | NO | now() |
| event_rsvps | event_id | uuid | NO | null |
| event_rsvps | user_id | uuid | NO | null |
| event_rsvps | attendance_status | text | YES | null |
| event_stats | event_id | uuid | YES | null |
| event_stats | title | text | YES | null |
| event_stats | start_date | timestamp with time zone | YES | null |
| event_stats | end_date | timestamp with time zone | YES | null |
| event_stats | location | text | YES | null |
| event_stats | is_virtual | boolean | YES | null |
| event_stats | category | text | YES | null |
| event_stats | is_featured | boolean | YES | null |
| event_stats | is_published | boolean | YES | null |
| event_stats | max_attendees | integer | YES | null |
| event_stats | organizer_id | uuid | YES | null |
| event_stats | organizer_name | text | YES | null |
| event_stats | attendee_count | bigint | YES | null |
| event_stats | spots_remaining | bigint | YES | null |
| events | id | uuid | NO | gen_random_uuid() |
| events | created_at | timestamp with time zone | NO | now() |
| events | updated_at | timestamp with time zone | YES | now() |
| events | title | text | NO | null |
| events | description | text | NO | null |
| events | start_date | timestamp with time zone | NO | null |
| events | end_date | timestamp with time zone | NO | null |
| events | venue | text | YES | null |
| events | is_virtual | boolean | YES | false |
| events | virtual_link | text | YES | null |
| events | organizer_id | uuid | NO | null |
| events | featured_image_url | text | YES | null |
| events | is_featured | boolean | YES | false |
| events | category | text | NO | 'General'::text |
| events | max_attendees | integer | YES | null |
| events | is_published | boolean | YES | false |
| events | tags | ARRAY | YES | null |
| events | slug | text | YES | null |
| events | agenda | jsonb | YES | null |
| events | event_type | text | YES | 'networking'::text |
| events | cost | text | YES | null |
| events | sponsors | text | YES | null |
| events | registration_url | text | YES | null |
| events | registration_deadline | timestamp with time zone | YES | null |
| events | created_by | uuid | YES | null |
| events | creator_id | uuid | YES | null |
| events | virtual_meeting_link | text | YES | null |
| events | user_id | uuid | YES | null |
| events | is_approved | boolean | YES | false |
| events | reminder_sent | boolean | YES | false |
| events | address | text | YES | null |
| events | organizer_email | text | YES | null |
| group_members | group_id | uuid | NO | null |
| group_members | user_id | uuid | NO | null |
| group_members | role | text | NO | 'member'::text |
| group_members | joined_at | timestamp with time zone | YES | now() |
| group_posts | id | uuid | NO | uuid_generate_v4() |
| group_posts | group_id | uuid | NO | null |
| group_posts | user_id | uuid | NO | null |
| group_posts | parent_post_id | uuid | YES | null |
| group_posts | content | text | NO | null |
| group_posts | created_at | timestamp with time zone | YES | now() |
| group_posts | updated_at | timestamp with time zone | YES | now() |
| groups | id | uuid | NO | uuid_generate_v4() |
| groups | name | text | NO | null |
| groups | description | text | YES | null |
| groups | created_by | uuid | YES | null |
| groups | created_at | timestamp with time zone | YES | now() |
| groups | updated_at | timestamp with time zone | YES | now() |
| groups | is_private | boolean | NO | false |
| groups | group_avatar_url | text | YES | null |
| groups | tags | ARRAY | YES | null |
| job_alerts | id | uuid | NO | uuid_generate_v4() |
| job_alerts | user_id | uuid | YES | null |
| job_alerts | alert_name | text | NO | null |
| job_alerts | job_titles | ARRAY | YES | null |
| job_alerts | industries | ARRAY | YES | null |
| job_alerts | locations | ARRAY | YES | null |
| job_alerts | job_types | ARRAY | YES | null |
| job_alerts | min_salary | integer | YES | null |
| job_alerts | keywords | ARRAY | YES | null |
| job_alerts | frequency | text | YES | null |
| job_alerts | enabled | boolean | YES | true |
| job_alerts | created_at | timestamp with time zone | YES | now() |
| job_alerts | updated_at | timestamp with time zone | YES | now() |
| job_applications | id | uuid | NO | gen_random_uuid() |
| job_applications | job_id | uuid | YES | null |
| job_applications | applicant_id | uuid | YES | null |
| job_applications | resume_url | text | YES | null |
| job_applications | cover_letter | text | YES | null |
| job_applications | status | text | YES | 'submitted'::text |
| job_applications | created_at | timestamp with time zone | YES | now() |
| job_applications | updated_at | timestamp with time zone | YES | now() |
| job_bookmarks | id | uuid | NO | gen_random_uuid() |
| job_bookmarks | created_at | timestamp with time zone | NO | now() |
| job_bookmarks | job_id | uuid | NO | null |
| job_bookmarks | user_id | uuid | NO | null |
| job_listings | id | uuid | NO | gen_random_uuid() |
| job_listings | creator_id | uuid | YES | null |
| job_listings | company_name | text | NO | null |
| job_listings | title | text | NO | null |
| job_listings | description | text | NO | null |
| job_listings | location | text | YES | null |
| job_listings | is_remote | boolean | YES | false |
| job_listings | job_type | text | YES | null |
| job_listings | salary_min | numeric | YES | null |
| job_listings | salary_max | numeric | YES | null |
| job_listings | application_url | text | YES | null |
| job_listings | contact_email | text | YES | null |
| job_listings | is_published | boolean | YES | false |
| job_listings | expires_at | timestamp with time zone | YES | null |
| job_listings | created_at | timestamp with time zone | YES | now() |
| job_listings | updated_at | timestamp with time zone | YES | now() |
| jobs | id | uuid | NO | uuid_generate_v4() |
| jobs | title | text | NO | null |
| jobs | company_name | text | NO | null |
| jobs | location | text | YES | null |
| jobs | job_type | text | YES | null |
| jobs | description | text | YES | null |
| jobs | requirements | text | YES | null |
| jobs | salary_range | text | YES | null |
| jobs | application_url | text | YES | null |
| jobs | contact_email | text | YES | null |
| jobs | expires_at | timestamp with time zone | YES | null |
| jobs | posted_by | uuid | YES | null |
| jobs | is_active | boolean | YES | true |
| jobs | created_at | timestamp with time zone | YES | now() |
| jobs | updated_at | timestamp with time zone | YES | now() |
| jobs | education_required | text | YES | null |
| jobs | required_skills | text | YES | null |
| jobs | deadline | timestamp with time zone | YES | null |
| jobs | experience_required | text | YES | null |
| jobs | education_level | text | YES | null |
| jobs | external_url | text | YES | null |
| jobs | industry | text | YES | null |
| jobs | application_instructions | text | YES | null |
| jobs | user_id | uuid | YES | null |
| jobs | is_approved | boolean | YES | false |
| jobs | company_id | uuid | YES | null |
| jobs | apply_url | text | YES | null |
| jobs | is_verified | boolean | NO | false |
| jobs | created_by | uuid | YES | null |
| mentee_profiles | id | uuid | NO | uuid_generate_v4() |
| mentee_profiles | user_id | uuid | NO | null |
| mentee_profiles | career_goals | text | YES | null |
| mentee_profiles | areas_seeking_mentorship | ARRAY | YES | null |
| mentee_profiles | specific_skills_to_develop | ARRAY | YES | null |
| mentee_profiles | preferred_mentor_characteristics | ARRAY | YES | null |
| mentee_profiles | time_commitment_available | text | YES | null |
| mentee_profiles | preferred_communication_method | ARRAY | YES | null |
| mentee_profiles | statement_of_expectations | text | YES | null |
| mentee_profiles | created_at | timestamp with time zone | YES | now() |
| mentee_profiles | updated_at | timestamp with time zone | YES | now() |
| mentees | id | uuid | NO | uuid_generate_v4() |
| mentees | user_id | uuid | YES | null |
| mentees | status | text | YES | 'pending'::text |
| mentees | career_goals | text | YES | null |
| mentees | preferred_industry | ARRAY | YES | null |
| mentees | created_at | timestamp with time zone | YES | now() |
| mentees | updated_at | timestamp with time zone | YES | now() |
| mentor_availability | id | uuid | NO | uuid_generate_v4() |
| mentor_availability | mentor_id | uuid | YES | null |
| mentor_availability | date | date | NO | null |
| mentor_availability | start_time | time without time zone | NO | null |
| mentor_availability | end_time | time without time zone | NO | null |
| mentor_availability | is_booked | boolean | YES | false |
| mentor_availability | created_at | timestamp with time zone | YES | now() |
| mentor_availability | updated_at | timestamp with time zone | YES | now() |
| mentor_profiles | id | uuid | NO | gen_random_uuid() |
| mentor_profiles | user_id | uuid | YES | null |
| mentor_profiles | mentoring_capacity_hours | integer | YES | 2 |
| mentor_profiles | areas_of_expertise | ARRAY | YES | null |
| mentor_profiles | mentoring_preferences | text | YES | null |
| mentor_profiles | mentoring_experience | text | YES | null |
| mentor_profiles | mentoring_statement | text | YES | null |
| mentor_profiles | max_mentees | integer | YES | 3 |
| mentor_profiles | is_accepting_mentees | boolean | YES | true |
| mentor_profiles | created_at | timestamp with time zone | YES | now() |
| mentor_profiles | updated_at | timestamp with time zone | YES | now() |
| mentors | id | uuid | NO | uuid_generate_v4() |
| mentors | user_id | uuid | YES | null |
| mentors | status | text | YES | 'pending'::text |
| mentors | expertise | ARRAY | YES | null |
| mentors | mentoring_experience_years | integer | YES | null |
| mentors | max_mentees | integer | YES | 5 |
| mentors | created_at | timestamp with time zone | YES | now() |
| mentors | updated_at | timestamp with time zone | YES | now() |
| mentors | mentoring_capacity_hours_per_month | integer | YES | null |
| mentors | mentoring_preferences | jsonb | YES | null |
| mentors | mentoring_statement | text | YES | null |
| mentors | mentoring_experience_description | text | YES | null |
| mentorship_appointments | id | uuid | NO | uuid_generate_v4() |
| mentorship_appointments | availability_id | uuid | YES | null |
| mentorship_appointments | mentee_id | uuid | YES | null |
| mentorship_appointments | topic | text | NO | null |
| mentorship_appointments | notes | text | YES | null |
| mentorship_appointments | status | text | YES | 'scheduled'::text |
| mentorship_appointments | feedback_provided | boolean | YES | false |
| mentorship_appointments | created_at | timestamp with time zone | YES | now() |
| mentorship_appointments | updated_at | timestamp with time zone | YES | now() |
| mentorship_programs | id | uuid | NO | gen_random_uuid() |
| mentorship_programs | title | text | NO | null |
| mentorship_programs | description | text | YES | null |
| mentorship_programs | start_date | timestamp with time zone | YES | null |
| mentorship_programs | end_date | timestamp with time zone | YES | null |
| mentorship_programs | is_active | boolean | YES | true |
| mentorship_programs | created_at | timestamp with time zone | YES | now() |
| mentorship_programs | updated_at | timestamp with time zone | YES | now() |
| mentorship_relationships | id | uuid | NO | gen_random_uuid() |
| mentorship_relationships | program_id | uuid | YES | null |
| mentorship_relationships | mentor_id | uuid | YES | null |
| mentorship_relationships | mentee_id | uuid | YES | null |
| mentorship_relationships | status | text | YES | 'pending'::text |
| mentorship_relationships | created_at | timestamp with time zone | YES | now() |
| mentorship_relationships | updated_at | timestamp with time zone | YES | now() |
| mentorship_requests | id | uuid | NO | uuid_generate_v4() |
| mentorship_requests | mentee_id | uuid | YES | null |
| mentorship_requests | mentor_id | uuid | YES | null |
| mentorship_requests | status | text | YES | null |
| mentorship_requests | message | text | YES | null |
| mentorship_requests | goals | text | YES | null |
| mentorship_requests | created_at | timestamp with time zone | YES | now() |
| mentorship_requests | updated_at | timestamp with time zone | YES | now() |
| mentorships | id | uuid | NO | gen_random_uuid() |
| mentorships | created_at | timestamp with time zone | NO | now() |
| mentorships | mentor_id | uuid | NO | null |
| mentorships | mentee_id | uuid | NO | null |
| mentorships | status | text | NO | 'requested'::text |
| mentorships | goals | text | YES | null |
| messages | id | uuid | NO | gen_random_uuid() |
| messages | conversation_id | uuid | NO | null |
| messages | sender_id | uuid | NO | null |
| messages | content | text | NO | null |
| messages | created_at | timestamp with time zone | NO | now() |
| messages | read_at | timestamp with time zone | YES | null |
| messages | recipient_id | uuid | YES | null |
| networking_group_members | id | uuid | NO | gen_random_uuid() |
| networking_group_members | group_id | uuid | YES | null |
| networking_group_members | user_id | uuid | YES | null |
| networking_group_members | role | text | YES | 'member'::text |
| networking_group_members | joined_at | timestamp with time zone | YES | now() |
| networking_groups | id | uuid | NO | gen_random_uuid() |
| networking_groups | name | text | NO | null |
| networking_groups | description | text | YES | null |
| networking_groups | type | text | YES | null |
| networking_groups | image_url | text | YES | null |
| networking_groups | visibility | text | YES | 'public'::text |
| networking_groups | admin_user_ids | ARRAY | YES | null |
| networking_groups | created_at | timestamp with time zone | YES | now() |
| notification_preferences | id | uuid | NO | gen_random_uuid() |
| notification_preferences | user_id | uuid | YES | null |
| notification_preferences | notification_type | text | NO | null |
| notification_preferences | email_enabled | boolean | YES | true |
| notification_preferences | push_enabled | boolean | YES | true |
| notification_preferences | in_app_enabled | boolean | YES | true |
| notification_preferences | created_at | timestamp with time zone | YES | now() |
| notification_preferences | updated_at | timestamp with time zone | YES | now() |
| notifications | id | uuid | NO | uuid_generate_v4() |
| notifications | profile_id | uuid | NO | null |
| notifications | title | text | NO | null |
| notifications | message | text | NO | null |
| notifications | link | text | YES | null |
| notifications | is_read | boolean | YES | false |
| notifications | created_at | timestamp with time zone | YES | now() |
| notifications | updated_at | timestamp with time zone | YES | now() |
| permissions | id | uuid | NO | uuid_generate_v4() |
| permissions | name | text | NO | null |
| permissions | description | text | YES | null |
| permissions | created_at | timestamp with time zone | NO | timezone('utc'::text, now()) |
| permissions | updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) |
| profiles | id | uuid | NO | null |
| profiles | email | text | NO | null |
| profiles | first_name | text | YES | null |
| profiles | last_name | text | YES | null |
| profiles | full_name | text | YES | null |
| profiles | avatar_url | text | YES | null |
| profiles | graduation_year | integer | YES | null |
| profiles | degree | text | YES | null |
| profiles | major | text | YES | null |
| profiles | current_company | text | YES | null |
| profiles | current_position | text | YES | null |
| profiles | location | text | YES | null |
| profiles | bio | text | YES | null |
| profiles | linkedin_url | text | YES | null |
| profiles | twitter_url | text | YES | null |
| profiles | website_url | text | YES | null |
| profiles | is_verified | boolean | YES | false |
| profiles | is_mentor | boolean | YES | false |
| profiles | created_at | timestamp with time zone | YES | now() |
| profiles | updated_at | timestamp with time zone | YES | now() |
| profiles | mentor_availability | text | YES | null |
| profiles | mentor_topics | ARRAY | YES | null |
| profiles | mentor_status | text | YES | 'pending'::text |
| profiles | mentee_status | text | YES | 'pending'::text |
| profiles | alumni_verification_status | text | YES | 'pending'::text |
| profiles | verification_document_url | text | YES | null |
| profiles | verification_notes | text | YES | null |
| profiles | verification_reviewed_by | uuid | YES | null |
| profiles | verification_reviewed_at | timestamp with time zone | YES | null |
| profiles | department | text | YES | null |
| profiles | phone | text | YES | null |
| profiles | github_url | text | YES | null |
| profiles | skills | ARRAY | YES | null |
| profiles | account_type | text | YES | null |
| profiles | student_id | text | YES | null |
| profiles | is_employer | boolean | YES | false |
| profiles | company_name | text | YES | null |
| profiles | company_website | text | YES | null |
| profiles | industry | text | YES | null |
| profiles | phone_number | text | YES | null |
| profiles | is_admin | boolean | YES | false |
| profiles | role | text | YES | 'user'::text |
| profiles | job_title | text | YES | null |
| profiles | years_experience | integer | YES | null |
| profiles | current_location | text | YES | null |
| profiles | degree_program | text | YES | null |
| profiles | current_job_title | text | YES | null |
| profiles | major_specialization | text | YES | null |
| profiles | biography | text | YES | null |
| profiles | privacy_level | text | YES | 'public'::text |
| profiles | is_online | boolean | YES | false |
| profiles | last_seen | timestamp with time zone | YES | null |
| profiles | username | text | YES | null |
| profiles | about | text | YES | null |
| profiles | headline | text | YES | null |
| profiles | company | text | YES | null |
| profiles | experience | text | YES | null |
| profiles | specialization | text | YES | null |
| profiles | achievements | ARRAY | YES | '{}'::text[] |
| profiles | interests | ARRAY | YES | '{}'::text[] |
| profiles | languages | ARRAY | YES | '{}'::text[] |
| profiles | social_links | jsonb | YES | '{}'::jsonb |
| profiles | verified | boolean | NO | false |
| profiles | batch_year | integer | YES | null |
| profiles | resume_url | text | YES | null |
| profiles | wants_job_alerts | boolean | YES | false |
| profiles | website | text | YES | null |
| profiles | is_available_for_mentorship | boolean | YES | false |
| profiles | mentorship_topics | ARRAY | YES | null |
| profiles | date_of_birth | date | YES | null |
| resources | id | uuid | NO | gen_random_uuid() |
| resources | created_at | timestamp with time zone | NO | now() |
| resources | title | text | NO | null |
| resources | description | text | YES | null |
| resources | url | text | YES | null |
| resources | resource_type | text | NO | null |
| resources | created_by | uuid | YES | null |
| resources | is_approved | boolean | NO | false |
| resume_profiles | id | uuid | NO | uuid_generate_v4() |
| resume_profiles | user_id | uuid | NO | null |
| resume_profiles | resume_url | text | YES | null |
| resume_profiles | cover_letter_url | text | YES | null |
| resume_profiles | portfolio_link | text | YES | null |
| resume_profiles | linkedin_profile | text | YES | null |
| resume_profiles | desired_job_titles | ARRAY | YES | null |
| resume_profiles | desired_industries | ARRAY | YES | null |
| resume_profiles | preferred_locations | ARRAY | YES | null |
| resume_profiles | willing_to_relocate | boolean | YES | false |
| resume_profiles | job_alert_active | boolean | YES | true |
| resume_profiles | job_alert_frequency | text | YES | 'daily'::text |
| resume_profiles | job_alert_keywords | ARRAY | YES | null |
| resume_profiles | created_at | timestamp with time zone | YES | now() |
| resume_profiles | updated_at | timestamp with time zone | YES | now() |
| role_permissions | role_id | uuid | NO | null |
| role_permissions | permission_id | uuid | NO | null |
| role_permissions | created_at | timestamp with time zone | NO | timezone('utc'::text, now()) |
| roles | id | uuid | NO | uuid_generate_v4() |
| roles | name | text | NO | null |
| roles | description | text | YES | null |
| roles | permissions | jsonb | NO | '{}'::jsonb |
| roles | created_at | timestamp with time zone | YES | now() |
| roles | updated_at | timestamp with time zone | YES | now() |
| system_alerts | id | uuid | NO | gen_random_uuid() |
| system_alerts | alert_type | text | NO | null |
| system_alerts | title | text | NO | null |
| system_alerts | message | text | NO | null |
| system_alerts | is_resolved | boolean | YES | false |
| system_alerts | resolved_by | uuid | YES | null |
| system_alerts | resolved_at | timestamp with time zone | YES | null |
| system_alerts | metadata | jsonb | YES | '{}'::jsonb |
| system_alerts | created_at | timestamp with time zone | YES | now() |
| system_analytics | id | uuid | NO | gen_random_uuid() |
| system_analytics | metric_name | text | NO | null |
| system_analytics | metric_value | numeric | YES | null |
| system_analytics | metric_type | text | YES | null |
| system_analytics | tags | jsonb | YES | null |
| system_analytics | recorded_at | timestamp with time zone | YES | now() |
| user_activity_logs | id | uuid | NO | gen_random_uuid() |
| user_activity_logs | user_id | uuid | YES | null |
| user_activity_logs | action | text | NO | null |
| user_activity_logs | resource_type | text | YES | null |
| user_activity_logs | resource_id | uuid | YES | null |
| user_activity_logs | metadata | jsonb | YES | null |
| user_activity_logs | ip_address | inet | YES | null |
| user_activity_logs | user_agent | text | YES | null |
| user_activity_logs | created_at | timestamp with time zone | YES | now() |
| user_resumes | id | uuid | NO | gen_random_uuid() |
| user_resumes | user_id | uuid | YES | null |
| user_resumes | filename | text | NO | null |
| user_resumes | file_url | text | NO | null |
| user_resumes | file_size | integer | YES | null |
| user_resumes | is_primary | boolean | YES | false |
| user_resumes | uploaded_at | timestamp with time zone | YES | now() |
| user_roles | id | uuid | NO | uuid_generate_v4() |
| user_roles | profile_id | uuid | NO | null |
| user_roles | role_id | uuid | NO | null |
| user_roles | assigned_by | uuid | YES | null |
| user_roles | created_at | timestamp with time zone | YES | now() |
| user_roles | updated_at | timestamp with time zone | YES | now() |









SAVE THIS TOO 


| schema_name | table_name                | policy_name                                                     | permissive | using_expression                                                                                                                                                                                                                                                                                                                      | with_check_expression                                                                                                                                                                                                       |
| ----------- | ------------------------- | --------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cron        | job                       | cron_job_policy                                                 | true       | (username = CURRENT_USER)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| cron        | job_run_details           | cron_job_run_details_policy                                     | true       | (username = CURRENT_USER)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | achievements              | Anyone can view achievements                                    | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | achievements              | Users can update their own achievements                         | true       | (auth.uid() = profile_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | admin_actions             | Admins can insert admin actions                                 | true       | null                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))                                                                            |
| public      | admin_actions             | Admins can view all admin actions                               | true       | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))                                                                                                                                                                                      | null                                                                                                                                                                                                                        |
| public      | bookmarked_jobs           | Allow users to delete their own bookmarks                       | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | bookmarked_jobs           | Allow users to insert their own bookmarks                       | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | bookmarked_jobs           | Allow users to view their own bookmarks                         | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | connections               | Users can accept/reject connection requests                     | true       | (auth.uid() = recipient_id)                                                                                                                                                                                                                                                                                                           | (status <> 'pending'::text)                                                                                                                                                                                                 |
| public      | connections               | Users can delete their connection requests                      | true       | ((auth.uid() = requester_id) OR (auth.uid() = recipient_id))                                                                                                                                                                                                                                                                          | null                                                                                                                                                                                                                        |
| public      | connections               | Users can request connections                                   | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = requester_id)                                                                                                                                                                                                 |
| public      | connections               | Users can update connection requests they received              | true       | (auth.uid() = recipient_id)                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public      | connections               | Users can view their own connections                            | true       | ((auth.uid() = requester_id) OR (auth.uid() = recipient_id))                                                                                                                                                                                                                                                                          | null                                                                                                                                                                                                                        |
| public      | content_approvals         | Admins can manage all content submissions                       | true       | (get_my_role() = 'admin'::text)                                                                                                                                                                                                                                                                                                       | (get_my_role() = 'admin'::text)                                                                                                                                                                                             |
| public      | content_approvals         | Creators can view their own content submissions                 | true       | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | content_moderation        | Admins can manage content moderation                            | true       | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))                                                                                                                                                                                      | null                                                                                                                                                                                                                        |
| public      | conversation_participants | Users can insert their own participation                        | true       | null                                                                                                                                                                                                                                                                                                                                  | (user_id = auth.uid())                                                                                                                                                                                                      |
| public      | conversation_participants | Users can view participants of their conversations              | true       | is_conversation_participant(conversation_id, auth.uid())                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | conversations             | Users can access conversations they participate in              | true       | is_conversation_participant(id, auth.uid())                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Authenticated users can register for events                     | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                       |
| public      | event_attendees           | Enable insert for users to RSVP for themselves                  | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | event_attendees           | Enable read access for all authenticated users                  | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Enable read access for authenticated users                      | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Enable update for users to change their own RSVP status         | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | event_attendees           | Enable users to delete their own RSVP                           | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Event attendees are viewable by everyone                        | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Event organizers can view registrations                         | true       | (EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = event_attendees.event_id) AND (events.organizer_id = auth.uid()))))                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Event registrations are viewable by everyone                    | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Users can cancel their own event registration                   | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Users can cancel their own registration                         | true       | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Users can cancel their own registrations                        | true       | (auth.uid() = attendee_id)                                                                                                                                                                                                                                                                                                            | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Users can register for events                                   | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = attendee_id)                                                                                                                                                                                                  |
| public      | event_attendees           | Users can register for published events                         | true       | null                                                                                                                                                                                                                                                                                                                                  | ((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = event_attendees.event_id) AND (events.is_published = true)))))                                                                          |
| public      | event_attendees           | Users can update their own event registration                   | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Users can update their own registration                         | true       | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Users can update their own registrations                        | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | event_attendees           | Users can view their own event registrations                    | true       | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | event_feedback            | Admins can delete any feedback                                  | true       | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | event_feedback            | Admins can view all event feedback                              | true       | (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)                                                                                                                                                                                                                                         | null                                                                                                                                                                                                                        |
| public      | event_feedback            | Organizers can view event feedback                              | true       | (EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = event_feedback.event_id) AND (events.organizer_id = auth.uid()))))                                                                                                                                                                                                            | null                                                                                                                                                                                                                        |
| public      | event_feedback            | Users can create their own feedback                             | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | event_feedback            | Users can manage their own event feedback                       | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | event_feedback            | Users can submit feedback                                       | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | event_feedback            | Users can update their own feedback                             | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | event_feedback            | Users can view all feedback                                     | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | event_feedback            | Users can view their own feedback                               | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | event_rsvps               | Allow authenticated users to view RSVPs                         | true       | (auth.role() = 'authenticated'::text)                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                        |
| public      | event_rsvps               | Users can manage their own RSVPs                                | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | events                    | Admins can manage all events                                    | true       | (get_my_role() = 'admin'::text)                                                                                                                                                                                                                                                                                                       | (get_my_role() = 'admin'::text)                                                                                                                                                                                             |
| public      | events                    | Allow admins to create events                                   | true       | null                                                                                                                                                                                                                                                                                                                                  | (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]))                                                                                                                                               |
| public      | events                    | Allow admins to manage all events                               | true       | (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)                                                                                                                                                                                                                                         | (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)                                                                                                                               |
| public      | events                    | Allow authorized users to delete events                         | true       | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | events                    | Allow authorized users to update events                         | true       | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | events                    | Allow public read access to events                              | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | events                    | Authenticated users can create events                           | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                       |
| public      | events                    | Events are editable by organizer                                | true       | (auth.uid() = organizer_id)                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public      | events                    | Events are viewable by everyone                                 | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | events                    | Events are viewable by everyone when published                  | true       | (is_published = true)                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                        |
| public      | events                    | Events can be created by authenticated users                    | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() IS NOT NULL)                                                                                                                                                                                                    |
| public      | events                    | Events can be deleted by organizer                              | true       | ((auth.uid() = organizer_id) OR (auth.uid() = created_by) OR (auth.uid() = creator_id))                                                                                                                                                                                                                                               | null                                                                                                                                                                                                                        |
| public      | events                    | Organizers can delete their own events                          | true       | (organizer_id = auth.uid())                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public      | events                    | Organizers can update their own events                          | true       | (organizer_id = auth.uid())                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public      | events                    | Organizers can view their own events                            | true       | (organizer_id = auth.uid())                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public      | events                    | Users can delete their own events                               | true       | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | events                    | Users can update their own events                               | true       | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | group_members             | Allow access if user is member of group                         | true       | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | group_members             | Allow members to leave or be removed by admins                  | true       | ((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm.group_id = group_members.group_id) AND (gm.user_id = auth.uid()) AND (gm.role = 'admin'::text)))))                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | group_members             | Allow users to join groups                                      | true       | null                                                                                                                                                                                                                                                                                                                                  | (( SELECT (NOT groups.is_private)
   FROM groups
  WHERE (groups.id = group_members.group_id)) OR (( SELECT groups.created_by
   FROM groups
  WHERE (groups.id = group_members.group_id)) = auth.uid()))                   |
| public      | group_members             | Join public groups                                              | true       | null                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM groups
  WHERE ((groups.id = group_members.group_id) AND (groups.is_private = false)))))                                                                             |
| public      | group_members             | Leave groups                                                    | true       | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | group_members             | Users can join public groups.                                   | true       | null                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM groups
  WHERE ((groups.id = group_members.group_id) AND (groups.is_private = false) AND (auth.uid() = group_members.user_id))))                                                                 |
| public      | group_members             | Users can leave groups.                                         | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | group_members             | View own memberships                                            | true       | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | group_posts               | Group admins can delete any post in their group.                | true       | (( SELECT group_members.role
   FROM group_members
  WHERE ((group_members.group_id = group_posts.group_id) AND (group_members.user_id = auth.uid()))) = 'admin'::text)                                                                                                                                                               | null                                                                                                                                                                                                                        |
| public      | group_posts               | Group members can create posts.                                 | true       | null                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_posts.group_id) AND (group_members.user_id = auth.uid()))))                                                                               |
| public      | group_posts               | Group members can view posts.                                   | true       | (group_id IN ( SELECT group_members.group_id
   FROM group_members
  WHERE (group_members.user_id = auth.uid())))                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public      | group_posts               | Group posts are viewable by group members.                      | true       | (EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_posts.group_id) AND (group_members.user_id = auth.uid()))))                                                                                                                                                                                         | null                                                                                                                                                                                                                        |
| public      | group_posts               | Users can delete their own posts.                               | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | group_posts               | Users can update their own posts.                               | true       | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | groups                    | Allow read access to groups                                     | true       | ((is_private = false) OR is_member_of_group(id))                                                                                                                                                                                                                                                                                      | null                                                                                                                                                                                                                        |
| public      | groups                    | Authenticated users can create groups.                          | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                       |
| public      | groups                    | Group admins can delete their group.                            | true       | (( SELECT group_members.role
   FROM group_members
  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid()))) = 'admin'::text)                                                                                                                                                                          | null                                                                                                                                                                                                                        |
| public      | groups                    | Group admins can update their group.                            | true       | (( SELECT group_members.role
   FROM group_members
  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid()))) = 'admin'::text)                                                                                                                                                                          | null                                                                                                                                                                                                                        |
| public      | groups                    | Group creators can update their groups.                         | true       | (auth.uid() = created_by)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | groups                    | Group creators can view their groups                            | true       | (created_by = auth.uid())                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | groups                    | Private groups are viewable by members                          | true       | (id IN ( SELECT group_members.group_id
   FROM group_members
  WHERE (group_members.user_id = auth.uid())))                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public      | groups                    | Public groups are viewable by everyone                          | true       | (is_private = false)                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | groups                    | Public groups are viewable by everyone.                         | true       | (is_private = false)                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | groups                    | Users can create groups.                                        | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = created_by)                                                                                                                                                                                                   |
| public      | job_applications          | Employers can view applications for their jobs                  | true       | (( SELECT jobs.created_by
   FROM jobs
  WHERE (jobs.id = job_applications.job_id)) = auth.uid())                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public      | job_applications          | Job creators can view applications                              | true       | (EXISTS ( SELECT 1
   FROM job_listings
  WHERE ((job_listings.id = job_applications.job_id) AND (job_listings.creator_id = auth.uid()))))                                                                                                                                                                                            | null                                                                                                                                                                                                                        |
| public      | job_applications          | Job posters can update application status                       | true       | (auth.uid() IN ( SELECT jobs.posted_by
   FROM jobs
  WHERE (jobs.id = job_applications.job_id)))                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public      | job_applications          | Users can apply to jobs                                         | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = applicant_id)                                                                                                                                                                                                 |
| public      | job_applications          | Users can manage their own job applications                     | true       | (auth.uid() = applicant_id)                                                                                                                                                                                                                                                                                                           | (auth.uid() = applicant_id)                                                                                                                                                                                                 |
| public      | job_applications          | Users can submit applications                                   | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = applicant_id)                                                                                                                                                                                                 |
| public      | job_applications          | Users can view applications for their jobs or their own applica | true       | ((auth.uid() = applicant_id) OR (auth.uid() IN ( SELECT jobs.posted_by
   FROM jobs
  WHERE (jobs.id = job_applications.job_id))))                                                                                                                                                                                                    | null                                                                                                                                                                                                                        |
| public      | job_applications          | Users can view their own applications                           | true       | ((auth.uid() = applicant_id) OR (EXISTS ( SELECT 1
   FROM jobs
  WHERE ((jobs.id = job_applications.job_id) AND (jobs.posted_by = auth.uid())))))                                                                                                                                                                                    | null                                                                                                                                                                                                                        |
| public      | job_bookmarks             | Users can create bookmarks                                      | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | job_bookmarks             | Users can delete their own bookmarks                            | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | job_bookmarks             | Users can manage their own job bookmarks                        | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | job_bookmarks             | Users can view their own bookmarks                              | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | job_listings              | Anyone can view published job listings                          | true       | (is_published = true)                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                        |
| public      | job_listings              | Creators can delete their own job listings                      | true       | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | job_listings              | Creators can update their own job listings                      | true       | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | job_listings              | Creators can view their own job listings                        | true       | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | jobs                      | Admins can manage all jobs                                      | true       | (get_my_role() = 'admin'::text)                                                                                                                                                                                                                                                                                                       | (get_my_role() = 'admin'::text)                                                                                                                                                                                             |
| public      | jobs                      | Allow authorized users to create jobs                           | true       | null                                                                                                                                                                                                                                                                                                                                  | (get_user_role(auth.uid()) = ANY (ARRAY['employer'::text, 'admin'::text, 'super_admin'::text]))                                                                                                                             |
| public      | jobs                      | Allow authorized users to delete jobs                           | true       | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | jobs                      | Allow authorized users to update jobs                           | true       | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | jobs                      | Allow public read access to jobs                                | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | jobs                      | Anyone can view active jobs                                     | true       | (is_active = true)                                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                        |
| public      | jobs                      | Authenticated users can create jobs                             | true       | null                                                                                                                                                                                                                                                                                                                                  | true                                                                                                                                                                                                                        |
| public      | jobs                      | Jobs are editable by poster                                     | true       | (auth.uid() = posted_by)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | jobs                      | Jobs are viewable by everyone                                   | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | jobs                      | Jobs can be deleted by poster                                   | true       | (auth.uid() = posted_by)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | jobs                      | Jobs can be posted by authenticated users                       | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() IS NOT NULL)                                                                                                                                                                                                    |
| public      | jobs                      | Users can delete their own jobs                                 | true       | (posted_by = auth.uid())                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | jobs                      | Users can update their own jobs                                 | true       | (posted_by = auth.uid())                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | mentee_profiles           | Allow users and admins to view mentee profiles                  | true       | ((user_id = auth.uid()) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | mentee_profiles           | Allow users to create their own mentee profile                  | true       | null                                                                                                                                                                                                                                                                                                                                  | (user_id = auth.uid())                                                                                                                                                                                                      |
| public      | mentee_profiles           | Allow users to update their own mentee profile                  | true       | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentees                   | Users can manage their own mentee profile                       | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentees                   | Users can view mentees they are mentoring                       | true       | ((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM mentorship_relationships
  WHERE ((mentorship_relationships.mentee_id = mentees.user_id) AND (mentorship_relationships.mentor_id = auth.uid())))))                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | mentees                   | mentees_insert_policy                                           | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | mentees                   | mentees_select_policy                                           | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentees                   | mentees_update_policy                                           | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentor_availability       | Anyone can view mentor availability                             | true       | (EXISTS ( SELECT 1
   FROM mentors
  WHERE ((mentors.id = mentor_availability.mentor_id) AND ((mentors.status = 'approved'::text) OR (mentors.user_id = auth.uid())))))                                                                                                                                                               | null                                                                                                                                                                                                                        |
| public      | mentor_availability       | Mentors can manage their own availability                       | true       | (EXISTS ( SELECT 1
   FROM mentors
  WHERE ((mentors.id = mentor_availability.mentor_id) AND (mentors.user_id = auth.uid()))))                                                                                                                                                                                                        | null                                                                                                                                                                                                                        |
| public      | mentor_availability       | mentor_availability_delete_policy                               | true       | (auth.uid() = mentor_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | mentor_availability       | mentor_availability_insert_policy                               | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = mentor_id)                                                                                                                                                                                                    |
| public      | mentor_availability       | mentor_availability_select_mentee_policy                        | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | mentor_availability       | mentor_availability_select_policy                               | true       | (auth.uid() = mentor_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | mentor_availability       | mentor_availability_update_policy                               | true       | (auth.uid() = mentor_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | mentors                   | Allow authenticated users to view mentor profiles               | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | mentors                   | Allow individual user to create their own mentor profile        | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | mentors                   | Allow individual user to read their own mentor profile          | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentors                   | Allow individual user to update their own mentor profile        | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | mentors                   | Allow users to create their own mentor profile                  | true       | null                                                                                                                                                                                                                                                                                                                                  | (user_id = auth.uid())                                                                                                                                                                                                      |
| public      | mentors                   | Allow users to update their own mentor profile                  | true       | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentors                   | Mentors are viewable by everyone                                | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | mentors                   | Mentors can delete their mentor profile                         | true       | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public      | mentors                   | Mentors can update their own info                               | true       | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public      | mentors                   | Users can become mentors                                        | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = id)                                                                                                                                                                                                           |
| public      | mentors                   | Users can manage their own mentor profile                       | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentors                   | Users can view approved mentors                                 | true       | ((status = 'approved'::text) OR (auth.uid() = user_id))                                                                                                                                                                                                                                                                               | null                                                                                                                                                                                                                        |
| public      | mentors                   | mentors_insert_policy                                           | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | mentors                   | mentors_select_policy                                           | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentors                   | mentors_update_policy                                           | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentorship_appointments   | Mentees can create appointments                                 | true       | null                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM mentees
  WHERE ((mentees.id = mentorship_appointments.mentee_id) AND (mentees.user_id = auth.uid()))))                                                                                          |
| public      | mentorship_appointments   | Users can manage their own appointments                         | true       | ((EXISTS ( SELECT 1
   FROM mentees
  WHERE ((mentees.id = mentorship_appointments.mentee_id) AND (mentees.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (mentor_availability ma
     JOIN mentors m ON ((ma.mentor_id = m.id)))
  WHERE ((ma.id = mentorship_appointments.availability_id) AND (m.user_id = auth.uid()))))) | null                                                                                                                                                                                                                        |
| public      | mentorship_appointments   | Users can view their own appointments                           | true       | ((EXISTS ( SELECT 1
   FROM mentees
  WHERE ((mentees.id = mentorship_appointments.mentee_id) AND (mentees.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (mentor_availability ma
     JOIN mentors m ON ((ma.mentor_id = m.id)))
  WHERE ((ma.id = mentorship_appointments.availability_id) AND (m.user_id = auth.uid()))))) | null                                                                                                                                                                                                                        |
| public      | mentorship_appointments   | mentorship_appointments_delete_policy                           | true       | (auth.uid() = mentee_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | mentorship_appointments   | mentorship_appointments_insert_policy                           | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = mentee_id)                                                                                                                                                                                                    |
| public      | mentorship_appointments   | mentorship_appointments_select_policy                           | true       | (auth.uid() = mentee_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | mentorship_appointments   | mentorship_appointments_update_policy                           | true       | (auth.uid() = mentee_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | mentorship_programs       | Anyone can view active mentorship programs                      | true       | (is_active = true)                                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                        |
| public      | mentorship_relationships  | Users can update their own mentorship relationships             | true       | ((auth.uid() = mentor_id) OR (auth.uid() = mentee_id))                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentorship_relationships  | Users can view their own mentorship relationships               | true       | ((auth.uid() = mentor_id) OR (auth.uid() = mentee_id))                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentorship_requests       | Mentors can respond to requests                                 | true       | (auth.uid() = mentor_id)                                                                                                                                                                                                                                                                                                              | (status <> 'pending'::text)                                                                                                                                                                                                 |
| public      | mentorship_requests       | Users can delete their mentorship requests                      | true       | ((auth.uid() = mentee_id) OR (auth.uid() = mentor_id))                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentorship_requests       | Users can request mentorship                                    | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = mentee_id)                                                                                                                                                                                                    |
| public      | mentorship_requests       | Users can view their mentor/mentee requests                     | true       | ((auth.uid() = mentee_id) OR (auth.uid() = mentor_id))                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | mentorships               | Mentees can request mentorship                                  | true       | null                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = mentee_id) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = mentorships.mentor_id) AND (profiles.is_available_for_mentorship = true)))))                                                      |
| public      | mentorships               | Mentors can update mentorship requests                          | true       | (auth.uid() = mentor_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | mentorships               | Users can view their own mentorships                            | true       | ((auth.uid() = mentor_id) OR (auth.uid() = mentee_id))                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | messages                  | Recipients can update messages                                  | true       | (auth.uid() = recipient_id)                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public      | messages                  | Users can insert messages in their conversations                | true       | null                                                                                                                                                                                                                                                                                                                                  | (is_conversation_participant(conversation_id, auth.uid()) AND (sender_id = auth.uid()))                                                                                                                                     |
| public      | messages                  | Users can send messages                                         | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = sender_id)                                                                                                                                                                                                    |
| public      | messages                  | Users can send messages in their conversations                  | true       | null                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM conversation_participants
  WHERE ((conversation_participants.conversation_id = messages.conversation_id) AND (conversation_participants.user_id = auth.uid()))))) |
| public      | messages                  | Users can view messages in their conversations                  | true       | is_conversation_participant(conversation_id, auth.uid())                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public      | messages                  | Users can view their own messages                               | true       | ((auth.uid() = sender_id) OR (auth.uid() = recipient_id))                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | notifications             | notifications_insert_policy                                     | true       | null                                                                                                                                                                                                                                                                                                                                  | true                                                                                                                                                                                                                        |
| public      | notifications             | notifications_select_policy                                     | true       | (auth.uid() = profile_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | notifications             | notifications_update_policy                                     | true       | (auth.uid() = profile_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public      | profiles                  | Profiles are viewable by everyone                               | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | profiles                  | Users can create their own profile                              | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = id)                                                                                                                                                                                                           |
| public      | profiles                  | Users can delete their own profile                              | true       | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public      | profiles                  | Users can update their own profile                              | true       | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                     | (auth.uid() = id)                                                                                                                                                                                                           |
| public      | resources                 | Admins can manage all resources                                 | true       | (get_my_role() = 'admin'::text)                                                                                                                                                                                                                                                                                                       | (get_my_role() = 'admin'::text)                                                                                                                                                                                             |
| public      | resources                 | Public can view approved resources                              | true       | (is_approved = true)                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | resources                 | Users can create resources                                      | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = created_by)                                                                                                                                                                                                   |
| public      | resume_profiles           | Resume profiles are viewable by everyone                        | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | resume_profiles           | Resumes are viewable by everyone                                | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | resume_profiles           | Users can create their own resume profile                       | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | resume_profiles           | Users can create their own resumes                              | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | resume_profiles           | Users can delete their own resume profile                       | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | resume_profiles           | Users can update their own resume profile                       | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | resume_profiles           | Users can update their own resumes                              | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | roles                     | Roles are viewable by everyone                                  | true       | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | roles                     | Super admins can create roles                                   | true       | null                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::text))))                                                                                                        |
| public      | roles                     | Super admins can delete roles                                   | true       | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::text))))                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | roles                     | Super admins can update roles                                   | true       | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::text))))                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public      | system_alerts             | Admins can manage system alerts                                 | true       | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))                                                                                                                                                                                      | null                                                                                                                                                                                                                        |
| public      | user_resumes              | Users can delete their own resumes                              | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | user_resumes              | Users can insert their own resumes                              | true       | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public      | user_resumes              | Users can update their own resumes                              | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | user_resumes              | Users can view their own resumes                                | true       | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public      | user_roles                | Admins can manage user roles                                    | true       | (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.profile_id = auth.uid()) AND (r.name = 'admin'::text))))                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public      | user_roles                | Users can view their own roles                                  | true       | (profile_id = auth.uid())                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| storage     | objects                   | Allow authenticated users to upload screenshots                 | true       | null                                                                                                                                                                                                                                                                                                                                  | ((bucket_id = 'feedback_screenshots'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))                                                                                                                       |
| storage     | objects                   | Allow public read access to feedback screenshots                | true       | (bucket_id = 'feedback_screenshots'::text)                                                                                                                                                                                                                                                                                            | null                                                                                                                                                                                                                        |
| storage     | objects                   | Anyone can upload cover letters                                 | true       | null                                                                                                                                                                                                                                                                                                                                  | ((bucket_id = 'cover-letters'::text) AND (auth.role() = 'authenticated'::text))                                                                                                                                             |
| storage     | objects                   | Anyone can upload resumes                                       | true       | null                                                                                                                                                                                                                                                                                                                                  | ((bucket_id = 'resumes'::text) AND (auth.role() = 'authenticated'::text))                                                                                                                                                   |
| storage     | objects                   | Authenticated users can upload                                  | true       | null                                                                                                                                                                                                                                                                                                                                  | ((auth.role() = 'authenticated'::text) AND (bucket_id = 'bucket-name'::text))                                                                                                                                               |
| storage     | objects                   | Avatar 1oj01fe_0                                                | true       | null                                                                                                                                                                                                                                                                                                                                  | (bucket_id = 'avatars'::text)                                                                                                                                                                                               |
| storage     | objects                   | Avatar 1oj01fe_1                                                | true       | (bucket_id = 'avatars'::text)                                                                                                                                                                                                                                                                                                         | null                                                                                                                                                                                                                        |
| storage     | objects                   | Avatar 1oj01fe_2                                                | true       | (bucket_id = 'avatars'::text)                                                                                                                                                                                                                                                                                                         | null                                                                                                                                                                                                                        |
| storage     | objects                   | Avatar 1oj01fe_3                                                | true       | (bucket_id = 'avatars'::text)                                                                                                                                                                                                                                                                                                         | null                                                                                                                                                                                                                        |
| storage     | objects                   | Cover letters are publicly accessible                           | true       | (bucket_id = 'cover-letters'::text)                                                                                                                                                                                                                                                                                                   | null                                                                                                                                                                                                                        |
| storage     | objects                   | Event Images 1o4y39n_0                                          | true       | (bucket_id = 'event-images'::text)                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                        |
| storage     | objects                   | Event Images 1o4y39n_1                                          | true       | null                                                                                                                                                                                                                                                                                                                                  | (bucket_id = 'event-images'::text)                                                                                                                                                                                          |
| storage     | objects                   | Event Images 1o4y39n_2                                          | true       | (bucket_id = 'event-images'::text)                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                        |
| storage     | objects                   | Event Images 1o4y39n_3                                          | true       | (bucket_id = 'event-images'::text)                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                        |
| storage     | objects                   | Message attachment access policy                                | true       | (bucket_id = 'message_attachments'::text)                                                                                                                                                                                                                                                                                             | (bucket_id = 'message_attachments'::text)                                                                                                                                                                                   |
| storage     | objects                   | Only owners can delete cover letters                            | true       | ((bucket_id = 'cover-letters'::text) AND (auth.uid() = owner))                                                                                                                                                                                                                                                                        | null                                                                                                                                                                                                                        |
| storage     | objects                   | Only owners can delete resumes                                  | true       | ((bucket_id = 'resumes'::text) AND (auth.uid() = owner))                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| storage     | objects                   | Only owners can update cover letters                            | true       | ((bucket_id = 'cover-letters'::text) AND (auth.uid() = owner))                                                                                                                                                                                                                                                                        | null                                                                                                                                                                                                                        |
| storage     | objects                   | Only owners can update resumes                                  | true       | ((bucket_id = 'resumes'::text) AND (auth.uid() = owner))                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| storage     | objects                   | Profile  vejz8c_0                                               | true       | (bucket_id = 'profile-images'::text)                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| storage     | objects                   | Profile  vejz8c_1                                               | true       | null                                                                                                                                                                                                                                                                                                                                  | (bucket_id = 'profile-images'::text)                                                                                                                                                                                        |
| storage     | objects                   | Profile  vejz8c_2                                               | true       | (bucket_id = 'profile-images'::text)                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| storage     | objects                   | Profile  vejz8c_3                                               | true       | (bucket_id = 'profile-images'::text)                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| storage     | objects                   | Public read access                                              | true       | (bucket_id = 'bucket-name'::text)                                                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| storage     | objects                   | Resumes are publicly accessible                                 | true       | (bucket_id = 'resumes'::text)                                                                                                                                                                                                                                                                                                         | null                                                                                                                                                                                                                        |
| storage     | objects                   | Users can delete own files                                      | true       | (((auth.uid())::text = (storage.foldername(name))[1]) AND (bucket_id = 'bucket-name'::text))                                                                                                                                                                                                                                          | null                                                                                                                                                                                                                        |
| storage     | objects                   | Users can update own files                                      | true       | (((auth.uid())::text = (storage.foldername(name))[1]) AND (bucket_id = 'bucket-name'::text))                                                                                                                                                                                                                                          | null                                                                                                                                                                                                                        |    
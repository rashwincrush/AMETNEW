// Centralized UX copy and labels for Mentorship module.
// Shared across banners, panels, cards, and dialogs.

export const MENTORSHIP_COPY = {
  banners: {
    mentee: {
      unapprovedProfile: {
        id: 'mentee_unapproved_profile',
        role: 'mentee',
        title: 'Get your profile approved to request mentors',
        body: 'Complete your profile and wait for approval before you can send mentorship requests. This keeps the network safe for everyone.',
        ctaLabel: 'Review my profile',
        ctaHref: '/profile',
      },
      noMentorsYet: {
        id: 'mentee_no_mentors_yet',
        role: 'mentee',
        title: 'You dont have a mentor yet',
        body: 'Browse the mentor directory and send a request to someone who matches your goals.',
        ctaLabel: 'Find a mentor',
        ctaHref: '/mentorship?tab=find',
      },
      hasActiveMentors: {
        id: 'mentee_has_active_mentors',
        role: 'mentee',
        title: 'You have active mentors',
        body: 'Check in with your mentors, review your goals, and schedule your next conversation.',
        ctaLabel: 'View my mentors',
        ctaHref: '/mentorship?tab=mentee',
      },
      pendingRequestsOnly: {
        id: 'mentee_pending_requests_only',
        role: 'mentee',
        title: 'Your mentorship requests are in progress',
        body: 'Youve requested mentorship. Youll be notified when mentors accept your requests.',
        ctaLabel: 'View my requests',
        ctaHref: '/mentorship?tab=requests&sub=sent',
      },
      inactiveMentee: {
        id: 'mentee_inactive',
        role: 'mentee',
        title: 'No active mentorships right now',
        body: 'You can keep your connections and still explore new mentors at any time.',
        ctaLabel: 'Explore mentors',
        ctaHref: '/mentorship?tab=find',
      },
    },
    mentor: {
      noMentorProfile: {
        id: 'mentor_no_profile',
        role: 'mentor',
        title: 'Share your experience as a mentor',
        body: 'Create a mentor profile so students and alumni can find you and request mentorship.',
        ctaLabel: 'Become a mentor',
        ctaHref: '/mentorship?tab=settings&mode=mentor',
      },
      pendingApproval: {
        id: 'mentor_pending_approval',
        role: 'mentor',
        title: 'Your mentor application is under review',
        body: 'An admin is reviewing your mentor profile. Youll be notified when youre approved.',
        ctaLabel: 'Edit mentor profile',
        ctaHref: '/mentorship?tab=settings&mode=mentor',
      },
      rejectedApplication: {
        id: 'mentor_rejected',
        role: 'mentor',
        title: 'Your mentor application was not approved',
        body: 'You can edit your details and submit your mentor profile again for review.',
        ctaLabel: 'Review and resubmit',
        ctaHref: '/mentorship?tab=settings&mode=mentor',
      },
      approvedAvailable: {
        id: 'mentor_approved_available',
        role: 'mentor',
        title: 'Youre visible in the mentor directory',
        body: 'Students and alumni can discover you and send new mentorship requests.',
        ctaLabel: 'Manage mentees',
        ctaHref: '/mentorship?tab=mentor',
      },
      approvedAtCapacity: {
        id: 'mentor_approved_at_capacity',
        role: 'mentor',
        title: 'Youre at capacity for new mentees',
        body: 'You wont receive new mentorship requests until you free up capacity or adjust your settings.',
        ctaLabel: 'Adjust capacity',
        ctaHref: '/mentorship?tab=settings&mode=mentor',
      },
      unavailable: {
        id: 'mentor_unavailable',
        role: 'mentor',
        title: 'Youre currently hidden from the mentor directory',
        body: 'Turn on your availability when youre ready to take on new mentees.',
        ctaLabel: 'Update availability',
        ctaHref: '/mentorship?tab=settings&mode=mentor',
      },
    },
    dual: {
      overview: {
        id: 'dual_overview',
        role: 'dual',
        title: 'Youre both a mentor and a mentee',
        body: 'Switch between your mentors and your mentees from this hub. Your actions as a mentee and mentor are kept separate and clear.',
        ctaLabel: 'Go to mentorship hub',
        ctaHref: '/mentorship',
      },
    },
  },
  emptyStates: {
    findMentors: {
      default: {
        title: 'No mentors found with these filters',
        body: 'Try adjusting your filters or broadening your search to discover more mentors.',
        ctaLabel: 'Clear filters',
      },
    },
    myMentors: {
      none: {
        title: 'You dont have any mentors yet',
        body: 'Request mentorship from alumni who match your interests and goals.',
        ctaLabel: 'Browse mentors',
        ctaHref: '/mentorship?tab=find',
      },
      pastOnly: {
        title: 'You have past mentorships, but none active',
        body: 'You can reconnect with previous mentors or find new mentors as your goals evolve.',
        ctaLabel: 'Find new mentors',
        ctaHref: '/mentorship?tab=find',
      },
    },
    myMentees: {
      none: {
        title: 'You dont have any mentees yet',
        body: 'Once your mentor profile is approved and youre available, mentees can request mentorship from you.',
        ctaLabel: 'Review mentor settings',
        ctaHref: '/mentorship?tab=settings&mode=mentor',
      },
      pastOnly: {
        title: 'You have past mentees, but none active',
        body: 'When youre ready, make yourself available again to take on new mentees.',
        ctaLabel: 'Open to mentees',
        ctaHref: '/mentorship?tab=settings&mode=mentor',
      },
    },
    requests: {
      sent: {
        none: {
          title: 'No mentorship requests sent yet',
          body: 'You havent requested mentorship from anyone yet. Start by finding a mentor who fits your goals.',
          ctaLabel: 'Find a mentor',
          ctaHref: '/mentorship?tab=find',
        },
      },
      received: {
        none: {
          title: 'No mentorship requests received yet',
          body: 'Youll see new requests here when mentees ask you for mentorship.',
          ctaLabel: 'Review mentor profile',
          ctaHref: '/mentorship?tab=settings&mode=mentor',
        },
      },
    },
  },
  buttons: {
    chat: {
      goToChat: 'Go to chat',
      openChat: 'Open chat',
      startChat: 'Start chat',
      sendFirstMessage: 'Send first message',
      opening: 'Opening...'
    },
    mentorship: {
      requestMentorship: 'Request mentorship',
      cancelRequest: 'Cancel request',
      acceptRequest: 'Accept request',
      rejectRequest: 'Reject request',
      viewRequests: 'View requests',
      endMentorship: 'End mentorship',
      scheduleSession: 'Schedule session',
    },
    connections: {
      requestConnection: 'Request connection',
      acceptConnection: 'Accept connection request',
      declineConnection: 'Decline connection request',
      cancelConnectionRequest: 'Cancel connection request',
      removeConnection: 'Remove from connections',
    },
  },
  dialogs: {
    rejectRequest: {
      title: 'Reject this mentorship request?',
      bodyGeneric: 'If you reject this request, this potential mentorship will not start. You can still stay connected and chat if you are already connected.',
      confirmLabel: 'Reject request',
      cancelLabel: 'Keep request',
    },
    endMentorship: {
      title: 'End this mentorship?',
      bodyGeneric: 'This mentorship will move to your Past list. Your existing messages will stay in your inbox and you can remain connected, but you will no longer be in an active mentorship.',
      confirmLabel: 'End mentorship',
      cancelLabel: 'Keep mentorship active',
    },
    removeConnection: {
      title: 'Remove this connection?',
      body: 'Removing this connection will stop new direct messages between you and this person unless you connect again. Any existing mentorships will remain unless you also end them from the Mentorship hub.',
      confirmLabel: 'Remove connection',
      cancelLabel: 'Keep connection',
    },
    declineConnection: {
      title: 'Decline this connection request?',
      body: 'If you decline this request, the sender will not be connected to you. You can still accept future requests if you change your mind.',
      confirmLabel: 'Decline request',
      cancelLabel: 'Keep pending',
    },
    cancelConnectionRequest: {
      title: 'Cancel this connection request?',
      body: 'If you cancel this request, it will be removed from the other persons inbox. You can send a new request later if needed.',
      confirmLabel: 'Cancel request',
      cancelLabel: 'Keep pending',
    },
  },
  chips: {
    statuses: {
      request: {
        pending: { label: 'Pending' },
        accepted: { label: 'Accepted' },
        rejected: { label: 'Declined' },
        cancelled: { label: 'Cancelled' },
      },
      relationship: {
        active: { label: 'Active' },
        completed: { label: 'Completed' },
        ended: { label: 'Ended' },
      },
    },
    roles: {
      mentor: { label: 'Your Mentor' },
      mentee: { label: 'Your Mentee' },
    },
    capacity: {
      atCapacity: { label: 'At capacity' },
      accepting: { label: 'Accepting mentees' },
      notAccepting: { label: 'Not accepting mentees' },
    },
  },
};

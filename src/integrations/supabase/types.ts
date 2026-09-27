export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      adCampaigns: {
        Row: {
          adType: string
          advertiserId: string
          createdAtMs: number
          creativeUrl: string | null
          endsAtMs: number | null
          id: string
          name: string
          region: string | null
          startsAtMs: number | null
          state: string | null
          status: string
          targetScope: string
          updatedAtMs: number
        }
        Insert: {
          adType: string
          advertiserId: string
          createdAtMs?: number
          creativeUrl?: string | null
          endsAtMs?: number | null
          id: string
          name: string
          region?: string | null
          startsAtMs?: number | null
          state?: string | null
          status?: string
          targetScope?: string
          updatedAtMs?: number
        }
        Update: {
          adType?: string
          advertiserId?: string
          createdAtMs?: number
          creativeUrl?: string | null
          endsAtMs?: number | null
          id?: string
          name?: string
          region?: string | null
          startsAtMs?: number | null
          state?: string | null
          status?: string
          targetScope?: string
          updatedAtMs?: number
        }
        Relationships: [
          {
            foreignKeyName: "adCampaigns_advertiserId_fkey"
            columns: ["advertiserId"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      adRequests: {
        Row: {
          adType: string | null
          budget: string | null
          business: string
          city: string | null
          consentAtMs: number | null
          contact: string
          contactName: string | null
          createdAtMs: number
          email: string | null
          id: string
          message: string
          packageName: string
          period: string | null
          phone: string | null
          socials: string | null
          source: string | null
          status: string
          website: string | null
        }
        Insert: {
          adType?: string | null
          budget?: string | null
          business: string
          city?: string | null
          consentAtMs?: number | null
          contact: string
          contactName?: string | null
          createdAtMs: number
          email?: string | null
          id: string
          message: string
          packageName: string
          period?: string | null
          phone?: string | null
          socials?: string | null
          source?: string | null
          status?: string
          website?: string | null
        }
        Update: {
          adType?: string | null
          budget?: string | null
          business?: string
          city?: string | null
          consentAtMs?: number | null
          contact?: string
          contactName?: string | null
          createdAtMs?: number
          email?: string | null
          id?: string
          message?: string
          packageName?: string
          period?: string | null
          phone?: string | null
          socials?: string | null
          source?: string | null
          status?: string
          website?: string | null
        }
        Relationships: []
      }
      advertisers: {
        Row: {
          city: string | null
          company: string
          contactName: string | null
          createdAtMs: number
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          state: string | null
          status: string
          updatedAtMs: number
          website: string | null
        }
        Insert: {
          city?: string | null
          company: string
          contactName?: string | null
          createdAtMs?: number
          email?: string | null
          id: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updatedAtMs?: number
          website?: string | null
        }
        Update: {
          city?: string | null
          company?: string
          contactName?: string | null
          createdAtMs?: number
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updatedAtMs?: number
          website?: string | null
        }
        Relationships: []
      }
      agenda_monetization_settings: {
        Row: {
          currency: string
          enabled: boolean
          featuredPriceCents: number | null
          id: number
          provider: string
          sponsoredPriceCents: number | null
          updatedAtMs: number
        }
        Insert: {
          currency?: string
          enabled?: boolean
          featuredPriceCents?: number | null
          id?: number
          provider?: string
          sponsoredPriceCents?: number | null
          updatedAtMs?: number
        }
        Update: {
          currency?: string
          enabled?: boolean
          featuredPriceCents?: number | null
          id?: number
          provider?: string
          sponsoredPriceCents?: number | null
          updatedAtMs?: number
        }
        Relationships: []
      }
      articleAudit: {
        Row: {
          action: string
          actorName: string
          actorOpenId: string
          afterJson: string | null
          articleId: string
          beforeJson: string | null
          createdAtMs: number
          id: string
        }
        Insert: {
          action: string
          actorName: string
          actorOpenId: string
          afterJson?: string | null
          articleId: string
          beforeJson?: string | null
          createdAtMs: number
          id: string
        }
        Update: {
          action?: string
          actorName?: string
          actorOpenId?: string
          afterJson?: string | null
          articleId?: string
          beforeJson?: string | null
          createdAtMs?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "articleAudit_articleId_fkey"
            columns: ["articleId"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author: string
          authorOpenId: string | null
          bodyHtml: string
          canonicalUrl: string | null
          category: string
          contentType: string
          contraponto: string | null
          country: string | null
          createdAt: string
          date: string
          editorialChecklist: Json
          editorialNotes: string | null
          featured: boolean
          focusKeyword: string | null
          id: string
          image: string
          imageAlt: string | null
          keyTakeaway: string | null
          language: string
          metaDescription: string | null
          noindex: boolean
          ogDescription: string | null
          ogTitle: string | null
          region: string | null
          scheduledAt: number | null
          scope: string
          seoTitle: string | null
          slug: string | null
          socialLinks: string | null
          sourceName: string | null
          sourceUrl: string | null
          state: string | null
          status: string
          summary: string
          tags: string
          title: string
          updated: string
          updatedAt: string
          views: number
          youtubeUrl: string | null
        }
        Insert: {
          author: string
          authorOpenId?: string | null
          bodyHtml: string
          canonicalUrl?: string | null
          category: string
          contentType?: string
          contraponto?: string | null
          country?: string | null
          createdAt?: string
          date: string
          editorialChecklist?: Json
          editorialNotes?: string | null
          featured?: boolean
          focusKeyword?: string | null
          id: string
          image: string
          imageAlt?: string | null
          keyTakeaway?: string | null
          language?: string
          metaDescription?: string | null
          noindex?: boolean
          ogDescription?: string | null
          ogTitle?: string | null
          region?: string | null
          scheduledAt?: number | null
          scope?: string
          seoTitle?: string | null
          slug?: string | null
          socialLinks?: string | null
          sourceName?: string | null
          sourceUrl?: string | null
          state?: string | null
          status?: string
          summary: string
          tags: string
          title: string
          updated: string
          updatedAt?: string
          views?: number
          youtubeUrl?: string | null
        }
        Update: {
          author?: string
          authorOpenId?: string | null
          bodyHtml?: string
          canonicalUrl?: string | null
          category?: string
          contentType?: string
          contraponto?: string | null
          country?: string | null
          createdAt?: string
          date?: string
          editorialChecklist?: Json
          editorialNotes?: string | null
          featured?: boolean
          focusKeyword?: string | null
          id?: string
          image?: string
          imageAlt?: string | null
          keyTakeaway?: string | null
          language?: string
          metaDescription?: string | null
          noindex?: boolean
          ogDescription?: string | null
          ogTitle?: string | null
          region?: string | null
          scheduledAt?: number | null
          scope?: string
          seoTitle?: string | null
          slug?: string | null
          socialLinks?: string | null
          sourceName?: string | null
          sourceUrl?: string | null
          state?: string | null
          status?: string
          summary?: string
          tags?: string
          title?: string
          updated?: string
          updatedAt?: string
          views?: number
          youtubeUrl?: string | null
        }
        Relationships: []
      }
      columnistInvites: {
        Row: {
          acceptedAtMs: number | null
          createdAtMs: number
          email: string
          expiresAtMs: number
          id: string
          invitedByOpenId: string | null
          name: string
          responsibilityAcceptedAtMs: number | null
          responsibilityAcceptedIp: string | null
          responsibilityAcceptedTermsId: string | null
          responsibilityAcceptedUserAgent: string | null
          responsibilityVersion: string | null
          revokedAtMs: number | null
          role: string
          status: string
          tokenHash: string
        }
        Insert: {
          acceptedAtMs?: number | null
          createdAtMs: number
          email: string
          expiresAtMs: number
          id: string
          invitedByOpenId?: string | null
          name: string
          responsibilityAcceptedAtMs?: number | null
          responsibilityAcceptedIp?: string | null
          responsibilityAcceptedTermsId?: string | null
          responsibilityAcceptedUserAgent?: string | null
          responsibilityVersion?: string | null
          revokedAtMs?: number | null
          role?: string
          status?: string
          tokenHash: string
        }
        Update: {
          acceptedAtMs?: number | null
          createdAtMs?: number
          email?: string
          expiresAtMs?: number
          id?: string
          invitedByOpenId?: string | null
          name?: string
          responsibilityAcceptedAtMs?: number | null
          responsibilityAcceptedIp?: string | null
          responsibilityAcceptedTermsId?: string | null
          responsibilityAcceptedUserAgent?: string | null
          responsibilityVersion?: string | null
          revokedAtMs?: number | null
          role?: string
          status?: string
          tokenHash?: string
        }
        Relationships: []
      }
      columnistProfiles: {
        Row: {
          beat: string
          bio: string
          facebook: string
          instagram: string
          linkedin: string
          name: string
          openId: string | null
          photo: string
          slug: string
          updatedAt: string
          x: string
        }
        Insert: {
          beat: string
          bio: string
          facebook: string
          instagram: string
          linkedin: string
          name: string
          openId?: string | null
          photo: string
          slug: string
          updatedAt?: string
          x: string
        }
        Update: {
          beat?: string
          bio?: string
          facebook?: string
          instagram?: string
          linkedin?: string
          name?: string
          openId?: string | null
          photo?: string
          slug?: string
          updatedAt?: string
          x?: string
        }
        Relationships: []
      }
      columnistResponsibilityAcceptances: {
        Row: {
          acceptedAtMs: number
          acceptedIp: string | null
          createdAtMs: number
          id: string
          inviteId: string
          termsId: string
          userAgent: string | null
          userOpenId: string
          version: string
        }
        Insert: {
          acceptedAtMs: number
          acceptedIp?: string | null
          createdAtMs?: number
          id: string
          inviteId: string
          termsId: string
          userAgent?: string | null
          userOpenId: string
          version: string
        }
        Update: {
          acceptedAtMs?: number
          acceptedIp?: string | null
          createdAtMs?: number
          id?: string
          inviteId?: string
          termsId?: string
          userAgent?: string | null
          userOpenId?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "columnistResponsibilityAcceptances_inviteId_fkey"
            columns: ["inviteId"]
            isOneToOne: false
            referencedRelation: "columnistInvites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "columnistResponsibilityAcceptances_termsId_fkey"
            columns: ["termsId"]
            isOneToOne: false
            referencedRelation: "editorialTerms"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          articleId: string
          createdAtMs: number
          id: string
          name: string
          repliedAtMs: number | null
          repliedBy: string | null
          reply: string | null
          status: string
          text: string
        }
        Insert: {
          articleId: string
          createdAtMs: number
          id: string
          name: string
          repliedAtMs?: number | null
          repliedBy?: string | null
          reply?: string | null
          status?: string
          text: string
        }
        Update: {
          articleId?: string
          createdAtMs?: number
          id?: string
          name?: string
          repliedAtMs?: number | null
          repliedBy?: string | null
          reply?: string | null
          status?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_articleId_fkey"
            columns: ["articleId"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorialAgentRuns: {
        Row: {
          actorOpenId: string
          agentId: string
          agentName: string
          articleId: string
          createdAtMs: number
          findingsJson: string
          id: string
          outputJson: string
          status: string
        }
        Insert: {
          actorOpenId: string
          agentId: string
          agentName: string
          articleId: string
          createdAtMs: number
          findingsJson: string
          id: string
          outputJson: string
          status: string
        }
        Update: {
          actorOpenId?: string
          agentId?: string
          agentName?: string
          articleId?: string
          createdAtMs?: number
          findingsJson?: string
          id?: string
          outputJson?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorialAgentRuns_articleId_fkey"
            columns: ["articleId"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorialFindingDecisions: {
        Row: {
          actorOpenId: string
          agentRunId: string
          articleId: string
          createdAtMs: number
          decision: string
          findingCode: string
          id: string
          note: string | null
          updatedAtMs: number
        }
        Insert: {
          actorOpenId: string
          agentRunId: string
          articleId: string
          createdAtMs: number
          decision: string
          findingCode: string
          id: string
          note?: string | null
          updatedAtMs: number
        }
        Update: {
          actorOpenId?: string
          agentRunId?: string
          articleId?: string
          createdAtMs?: number
          decision?: string
          findingCode?: string
          id?: string
          note?: string | null
          updatedAtMs?: number
        }
        Relationships: [
          {
            foreignKeyName: "editorialFindingDecisions_articleId_fkey"
            columns: ["articleId"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorialFreedomReviews: {
        Row: {
          actorOpenId: string
          articleId: string
          autonomyAnswer: string
          checksJson: string
          contentType: string
          createdAtMs: number
          id: string
          rulesetVersion: string
          score: number
          status: string
        }
        Insert: {
          actorOpenId: string
          articleId: string
          autonomyAnswer: string
          checksJson: string
          contentType: string
          createdAtMs: number
          id: string
          rulesetVersion: string
          score: number
          status: string
        }
        Update: {
          actorOpenId?: string
          articleId?: string
          autonomyAnswer?: string
          checksJson?: string
          contentType?: string
          createdAtMs?: number
          id?: string
          rulesetVersion?: string
          score?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorialFreedomReviews_articleId_fkey"
            columns: ["articleId"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorialMembers: {
        Row: {
          beat: string | null
          createdAtMs: number
          displayName: string
          openId: string
          profileSlug: string | null
          role: string
          status: string
          updatedAtMs: number
        }
        Insert: {
          beat?: string | null
          createdAtMs: number
          displayName: string
          openId: string
          profileSlug?: string | null
          role?: string
          status?: string
          updatedAtMs: number
        }
        Update: {
          beat?: string | null
          createdAtMs?: number
          displayName?: string
          openId?: string
          profileSlug?: string | null
          role?: string
          status?: string
          updatedAtMs?: number
        }
        Relationships: [
          {
            foreignKeyName: "editorialMembers_openId_fkey"
            columns: ["openId"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["openId"]
          },
        ]
      }
      editorialPautas: {
        Row: {
          angle: string
          articleId: string | null
          assignedToName: string | null
          assignedToOpenId: string | null
          briefing: string
          category: string
          checklistJson: Json
          createdAtMs: number
          createdByName: string | null
          createdByOpenId: string
          deadlineAtMs: number | null
          id: string
          plannedPublishAtMs: number | null
          priority: string
          sourcesJson: Json
          status: string
          tags: string
          title: string
          updatedAtMs: number
        }
        Insert: {
          angle?: string
          articleId?: string | null
          assignedToName?: string | null
          assignedToOpenId?: string | null
          briefing?: string
          category?: string
          checklistJson?: Json
          createdAtMs: number
          createdByName?: string | null
          createdByOpenId: string
          deadlineAtMs?: number | null
          id: string
          plannedPublishAtMs?: number | null
          priority?: string
          sourcesJson?: Json
          status?: string
          tags?: string
          title: string
          updatedAtMs: number
        }
        Update: {
          angle?: string
          articleId?: string | null
          assignedToName?: string | null
          assignedToOpenId?: string | null
          briefing?: string
          category?: string
          checklistJson?: Json
          createdAtMs?: number
          createdByName?: string | null
          createdByOpenId?: string
          deadlineAtMs?: number | null
          id?: string
          plannedPublishAtMs?: number | null
          priority?: string
          sourcesJson?: Json
          status?: string
          tags?: string
          title?: string
          updatedAtMs?: number
        }
        Relationships: [
          {
            foreignKeyName: "editorialPautas_articleId_fkey"
            columns: ["articleId"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorialPublicationQueue: {
        Row: {
          approvedByOpenId: string | null
          articleId: string
          createdAtMs: number
          id: string
          note: string | null
          publishedAtMs: number | null
          requestedByOpenId: string
          scheduledAtMs: number | null
          status: string
          updatedAtMs: number
        }
        Insert: {
          approvedByOpenId?: string | null
          articleId: string
          createdAtMs: number
          id: string
          note?: string | null
          publishedAtMs?: number | null
          requestedByOpenId: string
          scheduledAtMs?: number | null
          status?: string
          updatedAtMs: number
        }
        Update: {
          approvedByOpenId?: string | null
          articleId?: string
          createdAtMs?: number
          id?: string
          note?: string | null
          publishedAtMs?: number | null
          requestedByOpenId?: string
          scheduledAtMs?: number | null
          status?: string
          updatedAtMs?: number
        }
        Relationships: [
          {
            foreignKeyName: "editorialPublicationQueue_articleId_fkey"
            columns: ["articleId"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorialRequests: {
        Row: {
          articleId: string | null
          assignedToOpenId: string | null
          createdAtMs: number
          email: string
          evidence: string | null
          id: string
          name: string
          organization: string | null
          phone: string | null
          reason: string
          requestedChange: string
          requestType: string
          respondedAtMs: number | null
          respondedByOpenId: string | null
          responseText: string | null
          status: string
          updatedAtMs: number
        }
        Insert: {
          articleId?: string | null
          assignedToOpenId?: string | null
          createdAtMs?: number
          email: string
          evidence?: string | null
          id: string
          name: string
          organization?: string | null
          phone?: string | null
          reason: string
          requestedChange: string
          requestType: string
          respondedAtMs?: number | null
          respondedByOpenId?: string | null
          responseText?: string | null
          status?: string
          updatedAtMs?: number
        }
        Update: {
          articleId?: string | null
          assignedToOpenId?: string | null
          createdAtMs?: number
          email?: string
          evidence?: string | null
          id?: string
          name?: string
          organization?: string | null
          phone?: string | null
          reason?: string
          requestedChange?: string
          requestType?: string
          respondedAtMs?: number | null
          respondedByOpenId?: string | null
          responseText?: string | null
          status?: string
          updatedAtMs?: number
        }
        Relationships: [
          {
            foreignKeyName: "editorialRequests_articleId_fkey"
            columns: ["articleId"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorialResearchContexts: {
        Row: {
          actorOpenId: string
          articleId: string
          contextJson: Json
          createdAtMs: number
          fetchedAtMs: number
          id: string
          providersJson: Json
        }
        Insert: {
          actorOpenId: string
          articleId: string
          contextJson?: Json
          createdAtMs: number
          fetchedAtMs: number
          id: string
          providersJson?: Json
        }
        Update: {
          actorOpenId?: string
          articleId?: string
          contextJson?: Json
          createdAtMs?: number
          fetchedAtMs?: number
          id?: string
          providersJson?: Json
        }
        Relationships: [
          {
            foreignKeyName: "editorialResearchContexts_articleId_fkey"
            columns: ["articleId"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorialTerms: {
        Row: {
          content: string | null
          contentHash: string | null
          createdAtMs: number
          effectiveAtMs: number
          id: string
          publishedAtMs: number | null
          termType: string
          title: string
          version: string
        }
        Insert: {
          content?: string | null
          contentHash?: string | null
          createdAtMs?: number
          effectiveAtMs: number
          id: string
          publishedAtMs?: number | null
          termType: string
          title: string
          version: string
        }
        Update: {
          content?: string | null
          contentHash?: string | null
          createdAtMs?: number
          effectiveAtMs?: number
          id?: string
          publishedAtMs?: number | null
          termType?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      editorialWorkflowEvents: {
        Row: {
          action: string
          actorName: string | null
          actorOpenId: string
          articleId: string | null
          createdAtMs: number
          fromStatus: string | null
          id: string
          note: string | null
          pautaId: string | null
          toStatus: string
        }
        Insert: {
          action: string
          actorName?: string | null
          actorOpenId: string
          articleId?: string | null
          createdAtMs: number
          fromStatus?: string | null
          id: string
          note?: string | null
          pautaId?: string | null
          toStatus: string
        }
        Update: {
          action?: string
          actorName?: string | null
          actorOpenId?: string
          articleId?: string | null
          createdAtMs?: number
          fromStatus?: string | null
          id?: string
          note?: string | null
          pautaId?: string | null
          toStatus?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorialWorkflowEvents_articleId_fkey"
            columns: ["articleId"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorialWorkflowEvents_pautaId_fkey"
            columns: ["pautaId"]
            isOneToOne: false
            referencedRelation: "editorialPautas"
            referencedColumns: ["id"]
          },
        ]
      }
      event_promotions: {
        Row: {
          amountCents: number
          checkoutSessionId: string | null
          createdAtMs: number
          currency: string
          endsAtMs: number | null
          eventId: string
          id: string
          paidAtMs: number | null
          paymentReference: string | null
          promotionType: string
          provider: string
          startsAtMs: number | null
          status: string
          updatedAtMs: number
        }
        Insert: {
          amountCents: number
          checkoutSessionId?: string | null
          createdAtMs: number
          currency?: string
          endsAtMs?: number | null
          eventId: string
          id: string
          paidAtMs?: number | null
          paymentReference?: string | null
          promotionType: string
          provider?: string
          startsAtMs?: number | null
          status?: string
          updatedAtMs: number
        }
        Update: {
          amountCents?: number
          checkoutSessionId?: string | null
          createdAtMs?: number
          currency?: string
          endsAtMs?: number | null
          eventId?: string
          id?: string
          paidAtMs?: number | null
          paymentReference?: string | null
          promotionType?: string
          provider?: string
          startsAtMs?: number | null
          status?: string
          updatedAtMs?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_promotions_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string
          city: string
          commercialPriority: number
          contact: string
          country: string
          createdAtMs: number
          description: string
          editorialPriority: number
          endAtMs: number | null
          eventType: string
          id: string
          image: string | null
          importedAtMs: number | null
          latitude: string | null
          longitude: string | null
          organizer: string
          paymentStatus: string
          price: string | null
          promotionEndAtMs: number | null
          promotionStartAtMs: number | null
          promotionType: string
          sourceName: string | null
          sourceType: string
          sourceUrl: string | null
          sponsored: boolean
          startAtMs: number
          state: string
          status: string
          title: string
          updatedAtMs: number
          venue: string
          visibilityCity: string | null
          visibilityRegion: string | null
          visibilityScope: string
          visibilityState: string | null
          visibilitySubregion: string | null
          website: string | null
        }
        Insert: {
          address: string
          city: string
          commercialPriority?: number
          contact: string
          country?: string
          createdAtMs: number
          description: string
          editorialPriority?: number
          endAtMs?: number | null
          eventType: string
          id: string
          image?: string | null
          importedAtMs?: number | null
          latitude?: string | null
          longitude?: string | null
          organizer: string
          paymentStatus?: string
          price?: string | null
          promotionEndAtMs?: number | null
          promotionStartAtMs?: number | null
          promotionType?: string
          sourceName?: string | null
          sourceType?: string
          sourceUrl?: string | null
          sponsored?: boolean
          startAtMs: number
          state: string
          status?: string
          title: string
          updatedAtMs: number
          venue: string
          visibilityCity?: string | null
          visibilityRegion?: string | null
          visibilityScope?: string
          visibilityState?: string | null
          visibilitySubregion?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          city?: string
          commercialPriority?: number
          contact?: string
          country?: string
          createdAtMs?: number
          description?: string
          editorialPriority?: number
          endAtMs?: number | null
          eventType?: string
          id?: string
          image?: string | null
          importedAtMs?: number | null
          latitude?: string | null
          longitude?: string | null
          organizer?: string
          paymentStatus?: string
          price?: string | null
          promotionEndAtMs?: number | null
          promotionStartAtMs?: number | null
          promotionType?: string
          sourceName?: string | null
          sourceType?: string
          sourceUrl?: string | null
          sponsored?: boolean
          startAtMs?: number
          state?: string
          status?: string
          title?: string
          updatedAtMs?: number
          venue?: string
          visibilityCity?: string | null
          visibilityRegion?: string | null
          visibilityScope?: string
          visibilityState?: string | null
          visibilitySubregion?: string | null
          website?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          createdAtMs: number
          description: string | null
          id: string
          logo: string | null
          name: string
          partnerType: string
          sortOrder: number
          status: string
          updatedAtMs: number
          website: string | null
        }
        Insert: {
          createdAtMs?: number
          description?: string | null
          id: string
          logo?: string | null
          name: string
          partnerType: string
          sortOrder?: number
          status?: string
          updatedAtMs?: number
          website?: string | null
        }
        Update: {
          createdAtMs?: number
          description?: string | null
          id?: string
          logo?: string | null
          name?: string
          partnerType?: string
          sortOrder?: number
          status?: string
          updatedAtMs?: number
          website?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          createdAt: string
          email: string | null
          id: number
          lastSignedIn: string
          loginMethod: string | null
          name: string | null
          openId: string
          role: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email?: string | null
          id?: number
          lastSignedIn?: string
          loginMethod?: string | null
          name?: string | null
          openId: string
          role?: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string | null
          id?: number
          lastSignedIn?: string
          loginMethod?: string | null
          name?: string | null
          openId?: string
          role?: string
          updatedAt?: string
        }
        Relationships: []
      }
      viewEvents: {
        Row: {
          articleId: string
          id: string
          viewedAtMs: number
          visitorId: string
        }
        Insert: {
          articleId: string
          id: string
          viewedAtMs: number
          visitorId: string
        }
        Update: {
          articleId?: string
          id?: string
          viewedAtMs?: number
          visitorId?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewEvents_articleId_fkey"
            columns: ["articleId"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_article_view: {
        Args: { p_article_id: string; p_visitor_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      set_editorial_member_role: {
        Args: { p_role: string; p_target_open_id: string }
        Returns: {
          beat: string | null
          createdAtMs: number
          displayName: string
          openId: string
          profileSlug: string | null
          role: string
          status: string
          updatedAtMs: number
        }
        SetofOptions: {
          from: "*"
          to: "editorialMembers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sync_authenticated_user: {
        Args: { p_email: string; p_login_method: string; p_name: string }
        Returns: {
          createdAt: string
          email: string | null
          id: number
          lastSignedIn: string
          loginMethod: string | null
          name: string | null
          openId: string
          role: string
          updatedAt: string
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

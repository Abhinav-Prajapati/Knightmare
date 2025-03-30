"use client";

// External library imports
import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Internal imports
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import GoogleLoginIcon from "../../../../public/icons8-google-48.png";

// Schema definition
const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

type SignupFormFields = z.infer<typeof signupSchema>;

interface AuthResponse {
  token: string;
  id: string;
  name: string;
  email: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const SignupForm: React.FC = () => {
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormFields>({
    resolver: zodResolver(signupSchema),
  });

  const signupMutation = useMutation({
    mutationFn: async (formData: SignupFormFields) => {
      return axios.post<AuthResponse>(`${API_BASE_URL}/user/signin`, {
        email: formData.email,
        password: formData.password,
      });
    },
    onSuccess: (response) => {
      const { token, id, name: username, email } = response.data;
      const user = { id, username, email };

      login(token, user);
      router.push("/");
    },
    onError: (error: Error) => {
      console.error("Sign-in failed:", error.message);
    },
  });

  const onSubmit: SubmitHandler<SignupFormFields> = (data) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="px-10 pt-12 pb-10 mt-5 mb-4 max-w-full bg-slate-50 w-[30rem] max-md:px-5">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <h1 className="text-4xl font-semibold text-neutral-600 text-center">
          Sign In
        </h1>

        {/* Email Field */}
        <div className="flex flex-col mt-4 text-xl">
          <span className={errors.email ? "text-red-500" : "text-neutral-800"}>
            {errors.email?.message || "Email"}
          </span>
          <Input
            {...register("email")}
            type="email"
            placeholder="Enter your email"
            className="text-lg text-gray-400"
          />
          <div className="h-px border border-solid bg-neutral-400 border-neutral-400" />
        </div>

        {/* Password Field */}
        <div className="flex flex-col mt-4 text-xl">
          <span
            className={errors.password ? "text-red-500" : "text-neutral-800"}
          >
            {errors.password?.message || "Password"}
          </span>
          <Input
            {...register("password")}
            className="text-lg text-gray-400"
            type="password"
            placeholder="Enter a password"
          />
          <div className="h-px border border-solid bg-neutral-400 border-neutral-400" />
        </div>

        <button
          type="submit"
          className="justify-center items-center px-16 py-4 mt-10 text-xl whitespace-nowrap rounded-[10px] text-gray-600 max-md:px-5 max-md:mt-10 border-2 border-gray-400/50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Loading..." : "SIGN IN"}
        </button>
      </form>

      <Divider />

      <div className="w-full flex justify-center pt-4">
        <Image alt="Sign in with Google" src={GoogleLoginIcon} />
      </div>
    </div>
  );
};

const Divider: React.FC = () => (
  <div className="flex gap-2 mt-7 text-xl text-black whitespace-nowrap max-md:mt-10 ml-3">
    <div className="flex gap-1">
      <div className="shrink-0 my-auto h-0.5 border border-solid bg-neutral-400 border-neutral-400 w-[175px]" />
      <div>OR</div>
    </div>
    <div className="shrink-0 my-auto h-0.5 border border-solid bg-neutral-400 border-neutral-400 w-[175px]" />
  </div>
);

const SignInPage: React.FC = () => (
  <div className="flex flex-col">
    <SignupForm />
  </div>
);

export default SignInPage;
